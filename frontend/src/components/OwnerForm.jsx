import React, { useEffect } from 'react'
import { Form, Input, Button, Card, Typography, message, Space } from 'antd'
import { UserOutlined, PhoneOutlined, CarOutlined, IdcardOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { ownerAPI } from '../api/index.js'

const { Title, Paragraph } = Typography

export default function OwnerForm({ initialValues, onNext }) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    }
  }, [initialValues, form])

  const onFinish = async (values) => {
    try {
      const res = await ownerAPI.create(values)
      message.success('车主档案录入成功')
      onNext(res.data)
    } catch (err) {
      const msg = err?.response?.data?.detail || '录入失败，请检查信息'
      message.error(msg)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card type="inner" title="第 1 步：录入车主档案">
        <Paragraph type="secondary">
          请准确填写车主姓名、手机号、车牌号、身份证号等基础信息，这些信息将用于后续续费、发票开具及欠费拦截。
        </Paragraph>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label="车主姓名"
          name="name"
          rules={[{ required: true, message: '请输入车主姓名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入车主姓名" size="large" />
        </Form.Item>

        <Form.Item
          label="手机号"
          name="phone"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" size="large" />
        </Form.Item>

        <Form.Item
          label="车牌号"
          name="plate_number"
          rules={[{ required: true, message: '请输入车牌号' }]}
        >
          <Input prefix={<CarOutlined />} placeholder="例如：京A12345" size="large" />
        </Form.Item>

        <Form.Item
          label="身份证号"
          name="id_card"
          rules={[
            { required: true, message: '请输入身份证号' },
            { min: 15, max: 18, message: '身份证号长度不正确' }
          ]}
        >
          <Input prefix={<IdcardOutlined />} placeholder="请输入身份证号" size="large" />
        </Form.Item>

        <Form.Item label="联系地址" name="address">
          <Input prefix={<EnvironmentOutlined />} placeholder="选填：联系地址" size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" style={{ width: 200 }}>
            下一步：选择车位套餐
          </Button>
        </Form.Item>
      </Form>
    </Space>
  )
}
