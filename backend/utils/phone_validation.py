import re

def validate_phone_format(phone):
    """
    Validates that the phone number matches the format: +92-3XX-XXXXXXX
    Returns (bool, str): (is_valid, error_message)
    """
    if not phone:
        return False, "Phone number is required"
    
    # Pattern: +92 followed by dash, then 3 digits (starting with 3), then dash, then 7 digits
    # Regex: ^\+92-3\d{2}-\d{7}$
    
    pattern = r'^\+92-3\d{2}-\d{7}$'
    
    if not re.match(pattern, phone):
        return False, "Phone number must be in format: +92-3XX-XXXXXXX (e.g., +92-305-6789012)"
        
    return True, None

def format_phone_number(phone):
    """
    Attempts to format a phone number to standard format.
    Useful for cleaning input before validation if we want to be lenient,
    but user requested strict pattern enforcement on forms.
    """
    if not phone:
        return None
        
    # Remove non-digits
    digits = re.sub(r'\D', '', phone)
    
    # Check length
    if len(digits) == 12 and digits.startswith('923'):
         # 923... (12 digits) -> +92-3XX-XXXXXXX
         return f"+{digits[:2]}-{digits[2:5]}-{digits[5:]}"
         
    elif len(digits) == 11 and digits.startswith('03'):
         # 03... (11 digits) -> +92-3XX-XXXXXXX
         return f"+92-{digits[1:4]}-{digits[4:]}"
         
    elif len(digits) == 10 and digits.startswith('3'):
         # 3... (10 digits) -> +92-3XX-XXXXXXX
         return f"+92-{digits[:3]}-{digits[3:]}"
         
    return phone # Return original if pattern not recognized
