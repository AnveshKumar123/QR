from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from core.config import settings


Base = declarative_base()
metadata = Base.metadata

engine = create_async_engine(settings.DATABASE_URL, future=True, echo=settings.SQL_ECHO)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session