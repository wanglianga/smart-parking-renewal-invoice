from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class OwnerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=20)
    plate_number: str = Field(..., min_length=1, max_length=20)
    id_card: str = Field(..., min_length=1, max_length=30)
    address: Optional[str] = None


class OwnerCreate(OwnerBase):
    pass


class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    plate_number: Optional[str] = None
    id_card: Optional[str] = None
    address: Optional[str] = None


class OwnerResponse(OwnerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ParkingPackageBase(BaseModel):
    name: str
    duration_months: int
    price: float
    description: Optional[str] = None
    is_active: bool = True


class ParkingPackageCreate(ParkingPackageBase):
    pass


class ParkingPackageResponse(ParkingPackageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CouponBase(BaseModel):
    code: str
    name: str
    discount_type: str
    discount_value: float
    min_amount: float = 0.0
    max_discount: Optional[float] = None
    is_active: bool = True
    expires_at: Optional[date] = None


class CouponCreate(CouponBase):
    pass


class CouponResponse(CouponBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CouponCalculateRequest(BaseModel):
    coupon_id: int
    original_amount: float


class CouponCalculateResponse(BaseModel):
    coupon_id: int
    coupon_name: str
    original_amount: float
    discount_amount: float
    final_amount: float


class RenewalBase(BaseModel):
    owner_id: int
    package_id: int
    coupon_id: Optional[int] = None
    start_date: date


class RenewalCreate(RenewalBase):
    payment_method: Optional[str] = None


class RenewalUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None


class RenewalResponse(BaseModel):
    id: int
    owner_id: int
    package_id: int
    coupon_id: Optional[int] = None
    original_amount: float
    discount_amount: float
    final_amount: float
    status: str
    start_date: date
    end_date: date
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    owner: Optional[OwnerResponse] = None
    coupon: Optional[CouponResponse] = None

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    renewal_id: int
    owner_id: int
    title_type: str
    title: str
    tax_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    id: int
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ArrearsBase(BaseModel):
    owner_id: int
    renewal_id: Optional[int] = None
    amount: float
    description: Optional[str] = None


class ArrearsCreate(ArrearsBase):
    pass


class ArrearsResponse(BaseModel):
    id: int
    owner_id: int
    renewal_id: Optional[int] = None
    amount: float
    status: str
    description: Optional[str] = None
    checked_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ArrearsCheckResponse(BaseModel):
    owner_id: int
    owner_name: str
    plate_number: str
    has_arrears: bool
    total_arrears_amount: float
    arrears_list: list[ArrearsResponse]
    latest_renewal: Optional[RenewalResponse] = None
    final_status: str
    summary: str
    coupon_usage: Optional[dict] = None
