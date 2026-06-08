from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/coupons", tags=["优惠券"])


def calculate_discount(coupon: models.Coupon, original_amount: float) -> float:
    if original_amount < coupon.min_amount:
        return 0.0
    if coupon.discount_type == "fixed":
        discount = min(coupon.discount_value, original_amount)
    elif coupon.discount_type == "percent":
        discount = original_amount * (coupon.discount_value / 100)
    else:
        discount = 0.0
    if coupon.max_discount and discount > coupon.max_discount:
        discount = coupon.max_discount
    return round(discount, 2)


@router.post("", response_model=schemas.CouponResponse)
def create_coupon(coupon: schemas.CouponCreate, db: Session = Depends(get_db)):
    db_coupon = db.query(models.Coupon).filter(models.Coupon.code == coupon.code).first()
    if db_coupon:
        raise HTTPException(status_code=400, detail="优惠券编码已存在")
    new_coupon = models.Coupon(**coupon.model_dump())
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    return new_coupon


@router.get("", response_model=List[schemas.CouponResponse])
def list_coupons(is_active: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(models.Coupon)
    if is_active is not None:
        query = query.filter(models.Coupon.is_active == is_active)
    today = date.today()
    coupons = query.all()
    result = []
    for c in coupons:
        if c.expires_at and c.expires_at < today:
            continue
        result.append(c)
    return result


@router.get("/{coupon_id}", response_model=schemas.CouponResponse)
def get_coupon(coupon_id: int, db: Session = Depends(get_db)):
    db_coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not db_coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    return db_coupon


@router.post("/calculate", response_model=schemas.CouponCalculateResponse)
def calculate_coupon(req: schemas.CouponCalculateRequest, db: Session = Depends(get_db)):
    db_coupon = db.query(models.Coupon).filter(models.Coupon.id == req.coupon_id).first()
    if not db_coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    if not db_coupon.is_active:
        raise HTTPException(status_code=400, detail="优惠券已停用")
    if db_coupon.expires_at and db_coupon.expires_at < date.today():
        raise HTTPException(status_code=400, detail="优惠券已过期")
    discount = calculate_discount(db_coupon, req.original_amount)
    final = round(req.original_amount - discount, 2)
    if final < 0:
        final = 0.0
    return schemas.CouponCalculateResponse(
        coupon_id=db_coupon.id,
        coupon_name=db_coupon.name,
        original_amount=req.original_amount,
        discount_amount=discount,
        final_amount=final
    )
