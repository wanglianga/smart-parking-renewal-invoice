from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base, SessionLocal
from . import models
from .routers import owners, packages, coupons, renewals, invoices, arrears
from datetime import date, timedelta


def init_seed_data():
    db = SessionLocal()
    try:
        db_pkg_count = db.query(models.ParkingPackage).count()
        if db_pkg_count == 0:
            packages_data = [
                models.ParkingPackage(
                    name="月度套餐",
                    duration_months=1,
                    price=300.0,
                    description="标准月度停车包月",
                    is_active=True
                ),
                models.ParkingPackage(
                    name="季度套餐",
                    duration_months=3,
                    price=800.0,
                    description="季度套餐立省100元",
                    is_active=True
                ),
                models.ParkingPackage(
                    name="年度套餐",
                    duration_months=12,
                    price=3000.0,
                    description="年度套餐立省600元",
                    is_active=True
                )
            ]
            db.add_all(packages_data)

        db_coupon_count = db.query(models.Coupon).count()
        if db_coupon_count == 0:
            coupons_data = [
                models.Coupon(
                    code="NEW50",
                    name="新人立减50元",
                    discount_type="fixed",
                    discount_value=50.0,
                    min_amount=200.0,
                    max_discount=50.0,
                    is_active=True,
                    expires_at=date.today() + timedelta(days=365)
                ),
                models.Coupon(
                    code="VIP10",
                    name="VIP9折券",
                    discount_type="percent",
                    discount_value=10.0,
                    min_amount=0.0,
                    max_discount=200.0,
                    is_active=True,
                    expires_at=date.today() + timedelta(days=365)
                ),
                models.Coupon(
                    code="ANNUAL200",
                    name="年卡立减200元",
                    discount_type="fixed",
                    discount_value=200.0,
                    min_amount=2500.0,
                    max_discount=200.0,
                    is_active=True,
                    expires_at=date.today() + timedelta(days=365)
                )
            ]
            db.add_all(coupons_data)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    init_seed_data()
    yield


app = FastAPI(
    title="智慧停车包月续费与发票平台",
    description="车主档案 → 车位套餐 → 续费处理 → 发票抬头 → 欠费拦截验证",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(owners.router)
app.include_router(packages.router)
app.include_router(coupons.router)
app.include_router(renewals.router)
app.include_router(invoices.router)
app.include_router(arrears.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "parking-platform"}
