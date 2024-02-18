import fastapi
import fastapi.middleware.cors as cors
import uvicorn
from .routers import listing_router, user_router, token_router, booking_router, review_router, admin_router, payment_router, puzzle_router, badge_router
from argparse import ArgumentParser
from app.services import database_services, security_services, payment_services, puzzle_services
from app.schemas import user_schemas

app = fastapi.FastAPI()

# Setup backend to accept requests from frontend running at localhost:3000
origins = ["http://localhost:3000"]
app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add routes
app.include_router(user_router.router)
app.include_router(listing_router.router)
app.include_router(token_router.router)
app.include_router(booking_router.router)
app.include_router(review_router.router)
app.include_router(admin_router.router)
app.include_router(payment_router.router)
app.include_router(puzzle_router.router)
app.include_router(badge_router.router)

# Init db
database_services.init_database()

# Setup system bank accounts
payment_services.init_payments()

# Basic test routes, to be removed in final product
@app.get("/")
async def test():
    return "If you can see this, you have successfully connected to the backend :)"

@app.get("/test/login")
async def test_login(user: user_schemas.User = fastapi.Depends(security_services.valid_user)):
    return user

@app.get("/test/admin")
async def test_admin(user: user_schemas.User = fastapi.Depends(security_services.valid_admin)):
    return user

if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("-d", "--debug", action="store_true")
    args = parser.parse_args()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=args.debug)