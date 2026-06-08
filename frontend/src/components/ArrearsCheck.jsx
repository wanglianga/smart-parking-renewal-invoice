import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Typography,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tag,
  Table,
  Alert,
  Result,
  Divider,
  Space,
  Spin,
  Empty,
  message,
  Collapse
} from 'antd'
import {
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  TagOutlined,
  CarOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { arrearsAPI } from '../api/index.js'

const { Title, Paragraph, Text } = Typography

export default function ArrearsCheck({ owner, flowData, onPrev }) {
  const [loading, setLoading] = useState(false)
  const [checkResult, setCheckResult] = useState(null)

  const handleCheck = async () => {
    if (!owner?.id) return
    setLoading(true)
    try {
      const res = await arrearsAPI.check(owner.id)
      setCheckResult(res.data)
      message.success('欠费拦截验证完成')
    } catch (err) {
      const msg = err?.response?.data?.detail || '欠费拦截验证失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleCheck()
  }, [owner?.id])

  const statusMap = {
    normal: { color: 'green', icon: <CheckCircleOutlined />, text: '正常（无欠费）' },
    arrears_exists: { color: 'red', icon: <CloseCircleOutlined />, text: '存在欠费' },
    pending_payment: { color: 'orange', icon: <ExclamationCircleOutlined />, text: '待支付' },
    no_record: { color: 'default', icon: <ExclamationCircleOutlined />, text: '无续费记录' }
  }

  const statusInfo = checkResult ? statusMap[checkResult.final_status] || statusMap.no_record : null

  const arrearsColumns = [
    { title: '欠费ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '欠费金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v?.toFixed?.(2) || v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'unpaid' ? 'red' : 'default'}>{v}</Tag> },
    { title: '说明', dataIndex: 'description', key: 'description' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v) => new Date(v).toLocaleString('zh-CN') }
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        type="inner"
        title={
          <Space>
            <SafetyOutlined />
            第 5 步：欠费拦截验证（最终口径）
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleCheck} loading={loading}>
            重新验证
          </Button>
        }
      >
        <Alert
          type="warning"
          showIcon
          message="欠费拦截参与状态判断与结果汇总"
          description="本步骤会汇总车主的续费订单、优惠券使用情况、欠费记录等所有信息，得出最终口径（正常/欠费/待支付/无记录），并输出完整的验证摘要。"
        />
      </Card>

      <Spin spinning={loading} tip="正在执行欠费拦截验证...">
        {checkResult ? (
          <>
            <Card>
              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Statistic
                    title="车主信息"
                    value={checkResult.owner_name}
                    prefix={<UserOutlined />}
                  />
                  <Paragraph style={{ marginTop: 4 }}>
                    <CarOutlined /> 车牌：{checkResult.plate_number}
                  </Paragraph>
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="欠费总额"
                    value={checkResult.total_arrears_amount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: checkResult.has_arrears ? '#cf1322' : '#3f8600' }}
                  />
                  <Paragraph style={{ marginTop: 4 }}>
                    欠费笔数：{checkResult.arrears_list.length} 笔
                  </Paragraph>
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="最终口径"
                    valueRender={() => (
                      <Tag color={statusInfo?.color} icon={statusInfo?.icon} style={{ fontSize: 16, padding: '4px 12px' }}>
                        {statusInfo?.text}
                      </Tag>
                    )}
                  />
                  <Paragraph style={{ marginTop: 4 }}>
                    状态码：{checkResult.final_status}
                  </Paragraph>
                </Col>
              </Row>
            </Card>

            {checkResult.coupon_usage && (
              <Card title="优惠券使用详情（参与金额计算，非仅备注）" type="inner">
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="优惠券名称" span={1}>
                    <Tag color="blue" icon={<TagOutlined />}>{checkResult.coupon_usage.coupon_name}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="优惠编码">{checkResult.coupon_usage.coupon_code}</Descriptions.Item>
                  <Descriptions.Item label="折扣类型">
                    {checkResult.coupon_usage.discount_type === 'fixed' ? '固定金额' : '百分比折扣'}
                  </Descriptions.Item>
                  <Descriptions.Item label="折扣值">
                    {checkResult.coupon_usage.discount_type === 'fixed'
                      ? `¥${checkResult.coupon_usage.discount_value}`
                      : `${checkResult.coupon_usage.discount_value}%`}
                  </Descriptions.Item>
                  <Descriptions.Item label="订单原价">¥{checkResult.coupon_usage.original_amount?.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="抵扣金额">
                    <Text type="danger">-¥{checkResult.coupon_usage.discount_amount?.toFixed(2)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="实付金额" span={2}>
                    <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                      ¥{checkResult.coupon_usage.final_amount?.toFixed(2)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <Card title="欠费记录明细">
              {checkResult.arrears_list.length > 0 ? (
                <Table
                  size="small"
                  rowKey="id"
                  columns={arrearsColumns}
                  dataSource={checkResult.arrears_list}
                  pagination={false}
                />
              ) : (
                <Empty description="暂无欠费记录" />
              )}
            </Card>

            <Card
              title={
                <Space>
                  <SafetyOutlined />
                  欠费拦截最终验证摘要（结果汇总）
                </Space>
              }
            >
              {checkResult.has_arrears ? (
                <Result
                  status="warning"
                  title="欠费拦截触发：存在欠费记录"
                  subTitle={checkResult.summary}
                />
              ) : checkResult.final_status === 'normal' ? (
                <Result
                  status="success"
                  title="欠费拦截通过：一切正常"
                  subTitle={checkResult.summary}
                />
              ) : checkResult.final_status === 'pending_payment' ? (
                <Result
                  status="info"
                  title="欠费拦截提示：待支付"
                  subTitle={checkResult.summary}
                />
              ) : (
                <Result
                  status="info"
                  title="欠费拦截完成"
                  subTitle={checkResult.summary}
                />
              )}
            </Card>
          </>
        ) : (
          !loading && <Empty description="暂无验证结果" />
        )}
      </Spin>

      <Space>
        <Button size="large" onClick={onPrev}>上一步</Button>
      </Space>
    </Space>
  )
}
