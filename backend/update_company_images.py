from database import SessionLocal
import models

db = SessionLocal()
info = db.query(models.CompanyInfo).first()
if not info:
    info = models.CompanyInfo(name="Minstudio")
    db.add(info)

info.logo_url = "/images/company_logo.png"
info.seal_url = "/images/company_seal.png"

db.commit()
db.close()
print("Successfully updated company images in the database.")
