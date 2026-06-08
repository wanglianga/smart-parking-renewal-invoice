from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from ..database import get_db
from .. import models, schemas
from .coupons import calculate_discount

router = APIRouter(prefix="/api/renewals", tags=["续费处理"])


@router.post("", response_model=schemas.RenewalResponse)
def create_renewal(renewal: schemas.RenewalCreate, db: Session = Depends(get_db)):
    db_owner = db.query(models.Owner).filter(models.Owner.id == renewal.owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="车主不存在")
    db_pkg = db.query(models.ParkingPackage).filter(models.ParkingPackage.id == renewal.package_id).first()
    if not db_pkg:
        raise HTTPException(status_code=404, detail="套餐不存在")
    if not db_pkg.is_active:
        raise HTTPException(status_code=400, detail="套餐已停用")

    original_amount = db_pkg.price
    discount_amount = 0.0
    coupon_used = None

    if renewal.coupon_id:
        db_coupon = db.query(models.Coupon).filter(models.Coupon.id == renewal.coupon_id).first()
        if not db_coupon:
            raise HTTPException(status_code=404, detail="优惠券不存在")
        if not db_coupon.is_active:
            raise HTTPException(status_code=400, detail="优惠券已停用")
        if db_coupon.expires_at and db_coupon.expires_at < date.today():
            raise HTTPException(status_code=400, detail="优惠券已过期")
        discount_amount = calculate_discount(db_coupon, original_amount)
        coupon_used = db_coupon

    final_amount = round(original_amount - discount_amount, 2)
    if final_amount < 0:
        final_amount = 0.0

    end_date = renewal.start_date + relativedelta(months=db_pkg.duration_months)

    new_renewal = models.Renewal(
        owner_id=renewal.owner_id,
        package_id=renewal.package_id,
        coupon_id=renewal.coupon_id,
        original_amount=original_amount,
        discount_amount=discount_amount,
        final_amount=final_amount,
        status="paid" if renewal.payment_method else "pending",
        start_date=renewal.start_date,
        end_date=end_date,
        payment_method=renewal.payment_method,
        paid_at=datetime.now() if renewal.payment_method else None
    )
    db.add(new_renewal)

    if final_amount > 0 and not renewal.payment_method:
        arrears = models.Arrears(
            owner_id=renewal.owner_id,
            renewal_id=None,
            amount=final_amount,
            status="unpaid",
            description=f"包月续费待支付：{db_pkg.name}"
        )
        db.add(arrears)

    db.commit()
    db.refresh(new_renewal)
    return new_renewal


@router.get("", response_model=List[schemas.RenewalResponse])
def list_renewals(owner_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.Renewal)
    if owner_id:
        query = query.filter(models.Renewal.owner_id == owner_id)
    return query.order_by(models.Renewal.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{renewal_id}", response_model=schemas.RenewalResponse)
def get_renewal(renewal_id: int, db: Session = Depends(get_db)):
    db_renewal = db.query(models.Renewal).filter(models.Renewal.id == renewal_id).first()
    if not db_renewal:
        raise HTTPException(status_code=404, detail="续费记录不存在")
    return db_renewal


@router.put("/{renewal_id}", response_model=schemas.RenewalResponse)
def update_renewal(renewal_id: int, renewal: schemas.RenewalUpdate, db: Session = Depends(get_db)):
    db_renewal = db.query(models.Renewal).filter(models.Renewal.id == renewal_id).first()
    if not db_renewal:
        raise HTTPException(status_code=404, detail="续费记录不存在")
    update_data = renewal.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] == "paid" and not db_renewal.paid_at:
        db_renewal.paid_at = datetime.now()
    for key, value in update_data.items():
        setattr(db_renewal, key, value)
    db.commit()
    db.refresh(db_renewal)
    return db_renewal
