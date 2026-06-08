import React from 'react'
import {
  Form,
  Radio,
  Input,
  Button,
  Card,
  Typography,
  Descriptions,
  Statistic,
  Row,
  Col,
  message,
  Space,
  Alert
} from 'antd'
import {
  FileTextOutlined,
  UserOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CreditCardOutlined
} from '@ant-design/icons'
import { invoiceAPI } from '../api/index.js'

const { Title, Paragraph } = Typography

export default function InvoiceForm({ owner, renewal, onNext, onPrev }) {
  const [form] = Form.useForm()
  const titleType = Form.useWatch('title_type', form)

  const onFinish = async (values) => {
    try {
      const payload = {
        renewal_id: renewal.id,
        owner_id: owner.id,
        ...values
      }
      const res = await invoiceAPI.create(payload)
      message.success('发票抬头保存成功')
      onNext(res.data)
    } catch (err) {
      const msg = err?.response?.data?.detail || '发票信息保存失败'
      message.error(msg)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card type="inner" title="第 4 步：检查并录入发票抬头">
        <Descriptions size="small" column={2} style={{ marginBottom: 8 }}>
          <Descriptions.Item label="车主">{owner?.name}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{owner?.plate_number}</Descriptions.Item>
          <Descriptions.Item label="续费订单号">#{renewal?.id}</Descriptions.Item>
          <Descriptions.Item label="开票金额">
            <span style={{ color: '#1677ff', fontWeight: 'bold' }}>¥{renewal?.final_amount}</span>
          </Descriptions.Item>
        </Descriptions>
        <Alert
          type="info"
          showIcon
          message="发票信息用于生成电子发票"
          description="个人发票仅需抬头；企业发票必须提供纳税人识别号，其余信息选填。"
          style={{ marginTop: 8 }}
        />
      </Card>

      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="发票抬头类型"
              name="title_type"
              rules={[{ required: true, message: '请选择抬头类型' }]}
              initialValue="personal"
            >
              <Radio.Group size="large">
                <Radio.Button value="personal"><UserOutlined /> 个人/非企业</Radio.Button>
                <Radio.Button value="enterprise"><BankOutlined /> 企业单位</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="发票抬头"
              name="title"
              rules={[{ required: true, message: '请输入发票抬头' }]}
            >
              <Input
                size="large"
                prefix={<FileTextOutlined />}
                placeholder={titleType === 'enterprise' ? '请输入企业全称' : '请输入个人姓名'}
              />
            </Form.Item>

            {titleType === 'enterprise' && (
              <Form.Item
                label="纳税人识别号（税号）"
                name="tax_number"
                rules={[{ required: true, message: '企业发票必须填写税号' }]}
              >
                <Input size="large" prefix={<SafetyCertificateOutlined />} placeholder="请输入纳税人识别号" />
              </Form.Item>
            )}

            <Form.Item label="接收邮箱（选填）" name="email">
              <Input size="large" prefix={<MailOutlined />} placeholder="电子发票接收邮箱" />
            </Form.Item>

            {titleType === 'enterprise' && (
              <>
                <Form.Item label="企业注册地址（选填）" name="address">
                  <Input size="large" prefix={<EnvironmentOutlined />} placeholder="企业注册地址" />
                </Form.Item>
                <Form.Item label="企业电话（选填）" name="phone">
                  <Input size="large" prefix={<PhoneOutlined />} placeholder="企业联系电话" />
                </Form.Item>
                <Form.Item label="开户银行（选填）" name="bank_name">
                  <Input size="large" prefix={<BankOutlined />} placeholder="开户银行名称" />
                </Form.Item>
                <Form.Item label="银行账号（选填）" name="bank_account">
                  <Input size="large" prefix={<CreditCardOutlined />} placeholder="银行账号" />
                </Form.Item>
              </>
            )}

            <Space>
              <Button size="large" onClick={onPrev}>上一步</Button>
              <Button type="primary" size="large" htmlType="submit">
                下一步：欠费拦截验证
              </Button>
            </Space>
          </Form>
        </Col>

        <Col xs={24} md={10}>
          <Card title="续费订单概览" bordered style={{ position: 'sticky', top: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="原价" value={renewal?.original_amount} precision={2} prefix="¥" />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="优惠"
                    value={renewal?.discount_amount}
                    precision={2}
                    prefix="-¥"
                    valueStyle={{ color: renewal?.discount_amount > 0 ? '#cf1322' : '#000' }}
                  />
                </Col>
              </Row>
              <Statistic
                title="开票金额（实付）"
                value={renewal?.final_amount}
                precision={2}
                prefix="¥"
                valueStyle={{ fontSize: 28, color: '#1677ff' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
