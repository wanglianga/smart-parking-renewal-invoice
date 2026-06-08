from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/invoices", tags=["发票管理"])


@router.post("", response_model=schemas.InvoiceResponse)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    db_renewal = db.query(models.Renewal).filter(models.Renewal.id == invoice.renewal_id).first()
    if not db_renewal:
        raise HTTPException(status_code=404, detail="续费记录不存在")
    db_owner = db.query(models.Owner).filter(models.Owner.id == invoice.owner_id).first()
    if not db_owner:
        raise HTTPException(status_code=404, detail="车主不存在")
    if invoice.title_type not in ["personal", "enterprise"]:
        raise HTTPException(status_code=400, detail="抬头类型必须为 personal 或 enterprise")
    if invoice.title_type == "enterprise" and not invoice.tax_number:
        raise HTTPException(status_code=400, detail="企业发票必须提供税号")

    existing = db.query(models.Invoice).filter(models.Invoice.renewal_id == invoice.renewal_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="该续费订单已开具发票")

    new_invoice = models.Invoice(
        **invoice.model_dump(),
        amount=db_renewal.final_amount
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice


@router.get("", response_model=List[schemas.InvoiceResponse])
def list_invoices(owner_id: int = None, renewal_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.Invoice)
    if owner_id:
        query = query.filter(models.Invoice.owner_id == owner_id)
    if renewal_id:
        query = query.filter(models.Invoice.renewal_id == renewal_id)
    return query.order_by(models.Invoice.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{invoice_id}", response_model=schemas.InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    db_invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="发票不存在")
    return db_invoice


@router.put("/{invoice_id}", response_model=schemas.InvoiceResponse)
def update_invoice(invoice_id: int, invoice: schemas.InvoiceUpdate, db: Session = Depends(get_db)):
    db_invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="发票不存在")
    update_data = invoice.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_invoice, key, value)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice
