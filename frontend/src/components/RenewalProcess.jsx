import React, { useEffect, useState } from 'react'
import {
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Card,
  Typography,
  Descriptions,
  Statistic,
  Row,
  Col,
  Divider,
  Tag,
  message,
  Space,
  Alert
} from 'antd'
import {
  DollarOutlined,
  TagOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { couponAPI, renewalAPI } from '../api/index.js'

const { Title, Paragraph, Text } = Typography

export default function RenewalProcess({ owner, pkg, initialCoupon, onNext, onPrev }) {
  const [form] = Form.useForm()
  const [coupons, setCoupons] = useState([])
  const [selectedCouponId, setSelectedCouponId] = useState(initialCoupon?.coupon_id || null)
  const [calcResult, setCalcResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await couponAPI.list()
        setCoupons(res.data)
      } catch (err) {
        message.error('加载优惠券失败')
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedCouponId && pkg) {
      handleCalcCoupon(selectedCouponId)
    } else if (pkg) {
      setCalcResult({
        coupon_id: null,
        coupon_name: '不使用优惠券',
        original_amount: pkg.price,
        discount_amount: 0,
        final_amount: pkg.price
      })
    }
  }, [selectedCouponId, pkg])

  const handleCalcCoupon = async (couponId) => {
    if (!couponId || !pkg) return
    try {
      const res = await couponAPI.calculate(couponId, pkg.price)
      setCalcResult(res.data)
    } catch (err) {
      const msg = err?.response?.data?.detail || '优惠券计算失败'
      message.error(msg)
      setSelectedCouponId(null)
    }
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const payload = {
        owner_id: owner.id,
        package_id: pkg.id,
        coupon_id: selectedCouponId || null,
        start_date: values.start_date.format('YYYY-MM-DD'),
        payment_method: values.payment_method || null
      }
      const res = await renewalAPI.create(payload)
      message.success('续费处理成功')
      const couponData = calcResult
      onNext(res.data, couponData)
    } catch (err) {
      const msg = err?.response?.data?.detail || '续费处理失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const formatCouponLabel = (c) => {
    const typeText = c.discount_type === 'fixed' ? `立减¥${c.discount_value}` : `${c.discount_value}%折扣`
    return `${c.name} (${c.code}) - ${typeText}`
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card type="inner" title="第 3 步：续费处理（优惠券参与金额抵扣）">
        <Descriptions size="small" column={2} style={{ marginBottom: 8 }}>
          <Descriptions.Item label="车主">{owner?.name}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{owner?.plate_number}</Descriptions.Item>
          <Descriptions.Item label="套餐">{pkg?.name}</Descriptions.Item>
          <Descriptions.Item label="有效期">{pkg?.duration_months} 个月</Descriptions.Item>
        </Descriptions>
        <Alert
          type="info"
          showIcon
          message="优惠券不是备注字段"
          description="选择优惠券后系统将自动计算抵扣金额，订单会同时记录原价、优惠金额和实付金额，后续欠费拦截也会汇总优惠详情。"
          style={{ marginTop: 8 }}
        />
      </Card>

      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ start_date: dayjs() }}
          >
            <Form.Item
              label="选择优惠券"
              name="coupon_id"
            >
              <Select
                size="large"
                placeholder="可选：选择优惠券（参与实际金额抵扣）"
                allowClear
                value={selectedCouponId}
                onChange={(val) => setSelectedCouponId(val || null)}
                suffixIcon={<TagOutlined />}
                options={coupons.map((c) => ({
                  value: c.id,
                  label: formatCouponLabel(c)
                }))}
              />
            </Form.Item>

            <Form.Item
              label="续费起始日期"
              name="start_date"
              rules={[{ required: true, message: '请选择起始日期' }]}
            >
              <DatePicker size="large" style={{ width: '100%' }} suffixIcon={<CalendarOutlined />} />
            </Form.Item>

            <Form.Item label="支付方式（选填，留空则进入待支付/欠费状态）" name="payment_method">
              <Select
                size="large"
                placeholder="选择支付方式（选填）"
                allowClear
                options={[
                  { value: 'wechat', label: '微信支付' },
                  { value: 'alipay', label: '支付宝' },
                  { value: 'bank', label: '银行转账' },
                  { value: 'cash', label: '现金' }
                ]}
              />
            </Form.Item>

            <Space>
              <Button size="large" onClick={onPrev}>上一步</Button>
              <Button type="primary" size="large" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />}>
                确认续费并下一步
              </Button>
            </Space>
          </Form>
        </Col>

        <Col xs={24} md={10}>
          <Card title="费用明细" bordered style={{ position: 'sticky', top: 16 }}>
            {calcResult && (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="套餐原价" value={calcResult.original_amount} precision={2} prefix="¥" />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="优惠金额"
                      value={calcResult.discount_amount}
                      precision={2}
                      prefix="-¥"
                      valueStyle={{ color: calcResult.discount_amount > 0 ? '#cf1322' : '#000' }}
                    />
                  </Col>
                </Row>
                <Divider style={{ margin: '8px 0' }} />
                <Statistic
                  title="实付金额"
                  value={calcResult.final_amount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ fontSize: 28, color: '#1677ff' }}
                />
                <Tag color="blue" icon={<TagOutlined />}>
                  {calcResult.coupon_name}
                </Tag>
                {calcResult.discount_amount > 0 && (
                  <Paragraph type="success" style={{ margin: 0 }}>
                    <DollarOutlined /> 优惠券已生效，共节省 ¥{calcResult.discount_amount}
                  </Paragraph>
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
