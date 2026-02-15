#!/usr/bin/env python3
"""
Phase 1 to Phase 2 Data Migration Utility

This script migrates data from the Phase 1 Node.js mockup to Phase 2 FastAPI production.
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import async_session, engine
from app.core.redis import redis_client
from app.models import User, Product
from sqlalchemy.ext.asyncio import AsyncSession


class DataMigrator:
    """Handles data migration from Phase 1 to Phase 2"""
    
    def __init__(self):
        self.phase1_data_path = Path(__file__).parent.parent.parent / "phase1-mockup"
        self.migration_stats = {
            "users": {"migrated": 0, "failed": 0},
            "products": {"migrated": 0, "failed": 0},
            "sessions": {"migrated": 0, "failed": 0}
        }
    
    async def load_phase1_data(self) -> Dict[str, Any]:
        """Load data from Phase 1 mockup"""
        data = {}
        
        # Load users
        users_file = self.phase1_data_path / "config" / "server-config.json"
        if users_file.exists():
            with open(users_file, 'r') as f:
                config = json.load(f)
                data["users"] = config.get("mockData", {}).get("users", [])
                data["products"] = config.get("mockData", {}).get("products", [])
        
        return data
    
    async def migrate_users(self, session: AsyncSession, users: List[Dict]) -> None:
        """Migrate users to PostgreSQL"""
        for user_data in users:
            try:
                user = User(
                    id=user_data.get("id"),
                    name=user_data.get("name"),
                    email=user_data.get("email", f"user{user_data.get('id')}@example.com"),
                    preferences=user_data.get("preferences", {}),
                    created_at="2026-02-06T10:30:00.000Z"
                )
                session.add(user)
                await session.commit()
                self.migration_stats["users"]["migrated"] += 1
                print(f"✅ Migrated user: {user.name}")
                
            except Exception as e:
                await session.rollback()
                self.migration_stats["users"]["failed"] += 1
                print(f"❌ Failed to migrate user {user_data.get('id')}: {e}")
    
    async def migrate_products(self, session: AsyncSession, products: List[Dict]) -> None:
        """Migrate products to PostgreSQL"""
        for product_data in products:
            try:
                product = Product(
                    id=product_data.get("id"),
                    name=product_data.get("name"),
                    category=product_data.get("category"),
                    price=float(product_data.get("price", 0)),
                    description=product_data.get("description", ""),
                    stock=int(product_data.get("stock", 100)),
                    created_at="2026-02-06T10:30:00.000Z"
                )
                session.add(product)
                await session.commit()
                self.migration_stats["products"]["migrated"] += 1
                print(f"✅ Migrated product: {product.name}")
                
            except Exception as e:
                await session.rollback()
                self.migration_stats["products"]["failed"] += 1
                print(f"❌ Failed to migrate product {product_data.get('id')}: {e}")
    
    async def migrate_sessions(self, sessions: List[Dict]) -> None:
        """Migrate sessions to Redis"""
        for session_data in sessions:
            try:
                session_key = f"session:{session_data.get('id')}"
                await redis_client.setex(
                    session_key,
                    3600,  # 1 hour TTL
                    json.dumps(session_data)
                )
                self.migration_stats["sessions"]["migrated"] += 1
                print(f"✅ Migrated session: {session_data.get('id')}")
                
            except Exception as e:
                self.migration_stats["sessions"]["failed"] += 1
                print(f"❌ Failed to migrate session {session_data.get('id')}: {e}")
    
    async def validate_migration(self) -> bool:
        """Validate migration success"""
        async with async_session() as session:
            # Check users
            user_count = await session.execute("SELECT COUNT(*) FROM users")
            users_migrated = user_count.scalar()
            
            # Check products
            product_count = await session.execute("SELECT COUNT(*) FROM products")
            products_migrated = product_count.scalar()
            
            # Check Redis sessions
            session_keys = await redis_client.keys("session:*")
            sessions_migrated = len(session_keys)
        
        print(f"\n📊 Migration Validation:")
        print(f"   Users: {users_migrated} in database")
        print(f"   Products: {products_migrated} in database")
        print(f"   Sessions: {sessions_migrated} in Redis")
        
        return users_migrated > 0 and products_migrated > 0
    
    async def run_migration(self) -> None:
        """Run the complete migration process"""
        print("🚀 Starting Phase 1 to Phase 2 Data Migration...")
        print("=" * 50)
        
        # Load Phase 1 data
        print("📥 Loading Phase 1 data...")
        phase1_data = await self.load_phase1_data()
        
        if not phase1_data:
            print("❌ No Phase 1 data found to migrate")
            return
        
        print(f"   Found {len(phase1_data.get('users', []))} users")
        print(f"   Found {len(phase1_data.get('products', []))} products")
        
        # Migrate to database
        async with async_session() as session:
            # Migrate users
            if phase1_data.get("users"):
                print("\n👥 Migrating users...")
                await self.migrate_users(session, phase1_data["users"])
            
            # Migrate products
            if phase1_data.get("products"):
                print("\n🛍️  Migrating products...")
                await self.migrate_products(session, phase1_data["products"])
        
        # Migrate sessions (if any)
        print("\n🔄 Migrating sessions...")
        await self.migrate_sessions(phase1_data.get("sessions", []))
        
        # Validate migration
        print("\n🔍 Validating migration...")
        success = await self.validate_migration()
        
        # Print summary
        print("\n📊 Migration Summary:")
        print("=" * 30)
        for entity, stats in self.migration_stats.items():
            print(f"{entity.capitalize()}:")
            print(f"   ✅ Migrated: {stats['migrated']}")
            print(f"   ❌ Failed: {stats['failed']}")
        
        print(f"\n🎯 Migration Status: {'✅ SUCCESS' if success else '❌ FAILED'}")
        
        if success:
            print("\n🎉 Phase 2 is ready with migrated data!")
        else:
            print("\n⚠️  Migration completed with issues - check logs above")


async def main():
    """Main migration function"""
    migrator = DataMigrator()
    await migrator.run_migration()


if __name__ == "__main__":
    asyncio.run(main())
