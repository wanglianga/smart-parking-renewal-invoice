import React, { useEffect, useState } from 'react'
import { Card, Radio, Button, Typography, Descriptions, message, Space } from 'antd'
import { CarOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons'
import { packageAPI } from '../api/index.js'

const { Title, Paragraph } = Typography

export default function PackageSelect({ owner, initialValue, onNext, onPrev }) {
  const [packages, setPackages] = useState([])
  const [selectedId, setSelectedId] = useState(initialValue?.id)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await packageAPI.list(true)
        setPackages(res.data)
      } catch (err) {
        message.error('加载套餐失败')
      }
    }
    load()
  }, [])

  const handleNext = () => {
    const pkg = packages.find((p) => p.id === selectedId)
    if (!pkg) {
      message.warning('请选择车位套餐')
      return
    }
    onNext(pkg)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card type="inner" title="第 2 步：选择车位套餐">
        <Descriptions size="small" column={2} style={{ marginBottom: 8 }}>
          <Descriptions.Item label="车主">{owner?.name}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{owner?.plate_number}</Descriptions.Item>
        </Descriptions>
        <Paragraph type="secondary">
          请为该车主选择合适的包月套餐，不同时长对应不同优惠力度。
        </Paragraph>
      </Card>

      <Radio.Group
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}
      >
        {packages.map((pkg) => (
          <Radio.Button
            key={pkg.id}
            value={pkg.id}
            style={{
              height: 'auto',
              padding: 20,
              border: selectedId === pkg.id ? '2px solid #1677ff' : '1px solid #d9d9d9',
              borderRadius: 8,
              whiteSpace: 'normal',
              textAlign: 'left',
              lineHeight: 1.6
            }}
          >
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                <CarOutlined /> {pkg.name}
              </Title>
              <Paragraph style={{ margin: 0 }}>
                <CalendarOutlined /> 有效期：{pkg.duration_months} 个月
              </Paragraph>
              <Title level={3} type="success" style={{ margin: 0 }}>
                <DollarOutlined /> ¥{pkg.price}
              </Title>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
                {pkg.description}
              </Paragraph>
            </Space>
          </Radio.Button>
        ))}
      </Radio.Group>

      <Space>
        <Button size="large" onClick={onPrev}>
          上一步
        </Button>
        <Button type="primary" size="large" onClick={handleNext}>
          下一步：续费处理
        </Button>
      </Space>
    </Space>
  )
}
