import qrcode
import io
import base64
from typing import Tuple
import matplotlib.pyplot as plt
import numpy as np

def generate_qr_code(phone_number_code: str) -> Tuple[str, str]:
    """
    Generates QR code for phone number.
    
    Returns:
        Tuple of (qr_url, qr_image_base64)
        - qr_url: The data encoded in QR (tel: link)
        - qr_image_base64: Base64 encoded PNG image
    """
    # Create tel: link (opens phone dialer when scanned)
    str=f"https://0.0.0.0:8000/?'phone_number_code'={phone_number_code}"
    qr_data = f"url:{str}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert PIL Image to numpy array for matplotlib
    img_array = np.array(img)
    
    # Display the image
    plt.imshow(img_array, cmap='gray')
    plt.axis('off')  # Hide axes
    plt.title(f'QR Code for {phone_number_code}')
    plt.show()
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return qr_data, img_base64