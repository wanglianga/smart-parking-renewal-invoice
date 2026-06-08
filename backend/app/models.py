from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    plate_number = Column(String(20), nullable=False, unique=True)
    id_card = Column(String(30), nullable=False)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    renewals = relationship("Renewal", back_populates="owner")
    invoices = relationship("Invoice", back_populates="owner")
    arrears = relationship("Arrears", back_populates="owner")


class ParkingPackage(Base):
    __tablename__ = "parking_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    duration_months = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    discount_type = Column(String(20), nullable=False)
    discount_value = Column(Float, nullable=False)
    min_amount = Column(Float, default=0.0)
    max_discount = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    renewals = relationship("Renewal", back_populates="coupon")


class Renewal(Base):
    __tablename__ = "renewals"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("parking_packages.id"), nullable=False)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=True)
    original_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("Owner", back_populates="renewals")
    coupon = relationship("Coupon", back_populates="renewals")
    invoice = relationship("Invoice", back_populates="renewal", uselist=False)
    arrears = relationship("Arrears", back_populates="renewal")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    renewal_id = Column(Integer, ForeignKey("renewals.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    title_type = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    tax_number = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(50), nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    renewal = relationship("Renewal", back_populates="invoice")
    owner = relationship("Owner", back_populates="invoices")


class Arrears(Base):
    __tablename__ = "arrears"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    renewal_id = Column(Integer, ForeignKey("renewals.id"), nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="unpaid")
    description = Column(Text, nullable=True)
    checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("Owner", back_populates="arrears")
    renewal = relationship("Renewal", back_populates="arrears")
