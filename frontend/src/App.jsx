import React, { useState } from 'react'
import { Layout, Steps, theme, Result, Button, Typography, Card, Space } from 'antd'
import {
  UserOutlined,
  CarOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import OwnerForm from './components/OwnerForm.jsx'
import PackageSelect from './components/PackageSelect.jsx'
import RenewalProcess from './components/RenewalProcess.jsx'
import InvoiceForm from './components/InvoiceForm.jsx'
import ArrearsCheck from './components/ArrearsCheck.jsx'

const { Header, Content, Footer } = Layout
const { Title } = Typography

export default function App() {
  const { token } = theme.useToken()
  const [current, setCurrent] = useState(0)
  const [flowData, setFlowData] = useState({
    owner: null,
    pkg: null,
    coupon: null,
    renewal: null,
    invoice: null
  })

  const steps = [
    { title: '车主档案录入', icon: <UserOutlined />, key: 'owner' },
    { title: '车位套餐选择', icon: <CarOutlined />, key: 'pkg' },
    { title: '续费处理', icon: <CreditCardOutlined />, key: 'renewal' },
    { title: '发票抬头检查', icon: <FileTextOutlined />, key: 'invoice' },
    { title: '欠费拦截验证', icon: <SafetyOutlined />, key: 'arrears' }
  ]

  const next = (key, data) => {
    setFlowData((prev) => ({ ...prev, [key]: data }))
    setCurrent((prev) => prev + 1)
  }

  const prev = () => setCurrent((prev) => Math.max(0, prev - 1))

  const reset = () => {
    setCurrent(0)
    setFlowData({
      owner: null,
      pkg: null,
      coupon: null,
      renewal: null,
      invoice: null
    })
  }

  const renderStep = () => {
    switch (current) {
      case 0:
        return (
          <OwnerForm
            initialValues={flowData.owner}
            onNext={(data) => next('owner', data)}
          />
        )
      case 1:
        return (
          <PackageSelect
            owner={flowData.owner}
            initialValue={flowData.pkg}
            onNext={(data) => next('pkg', data)}
            onPrev={prev}
          />
        )
      case 2:
        return (
          <RenewalProcess
            owner={flowData.owner}
            pkg={flowData.pkg}
            initialCoupon={flowData.coupon}
            onNext={(renewalData, couponData) => {
              setFlowData((prev) => ({
                ...prev,
                coupon: couponData,
                renewal: renewalData
              }))
              setCurrent(3)
            }}
            onPrev={prev}
          />
        )
      case 3:
        return (
          <InvoiceForm
            owner={flowData.owner}
            renewal={flowData.renewal}
            onNext={(data) => next('invoice', data)}
            onPrev={prev}
          />
        )
      case 4:
        return (
          <ArrearsCheck
            owner={flowData.owner}
            flowData={flowData}
            onPrev={prev}
          />
        )
      default:
        return null
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 32px'
        }}
      >
        <CarOutlined style={{ fontSize: 24, color: token.colorPrimary, marginRight: 12 }} />
        <Title level={4} style={{ margin: 0 }}>
          智慧停车包月续费与发票平台
        </Title>
      </Header>

      <Content style={{ padding: '32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Card style={{ marginBottom: 24 }}>
          <Steps
            current={current}
            items={steps}
            size="default"
          />
        </Card>

        <Card>
          {current < 5 ? (
            renderStep()
          ) : (
            <Result
              status="success"
              title="全流程已完成"
              subTitle="车主档案→套餐选择→续费处理→发票→欠费拦截，全部步骤执行完毕"
              extra={
                <Space>
                  <Button type="primary" icon={<ReloadOutlined />} onClick={reset}>
                    重新开始新流程
                  </Button>
                </Space>
              }
            />
          )}
        </Card>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        智慧停车包月续费与发票平台 ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}
