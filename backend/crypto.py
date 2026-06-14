import os
from cryptography.fernet import Fernet

# For production, this should be set via environment variable.
# For local dev/portfolio purposes, we generate a static key to avoid DB reset issues.
# A 32-byte url-safe base64-encoded key is required by Fernet.
# This was generated using Fernet.generate_key()
DEFAULT_KEY = b'G0m9_R8gO8P4_5_2N0xU7qY4j8V2K3uT9pA1M5eN8wI='

def get_fernet():
    key = os.getenv("ENCRYPTION_KEY", DEFAULT_KEY)
    return Fernet(key)

def encrypt_data(data: str) -> str:
    if not data:
        return data
    f = get_fernet()
    # If the data is already encrypted (starts with 'gAAAAA'), avoid double encryption.
    # Fernet tokens start with gAAAAA.
    if data.startswith('gAAAAA'):
        return data
    encrypted = f.encrypt(data.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_data(data: str) -> str:
    if not data:
        return data
    f = get_fernet()
    try:
        # If it's not a fernet token, it will throw an exception
        decrypted = f.decrypt(data.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception:
        # If decryption fails (e.g., legacy plaintext), return as is
        return data

def mask_resident_num(data: str) -> str:
    """Mask the resident number, keeping only the birthdate and the first digit of the second part."""
    if not data:
        return data
    
    # Try to decrypt first
    decrypted = decrypt_data(data)
    
    # Standard format: 900101-1234567
    if len(decrypted) == 14 and decrypted[6] == '-':
        return f"{decrypted[:8]}******"
    elif len(decrypted) == 13: # No hyphen
        return f"{decrypted[:7]}******"
        
    # If format is unrecognized, just return masked fully or as is
    return decrypted
