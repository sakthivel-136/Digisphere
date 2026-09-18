def normalize_qr(qr_val):
    try:
        return str(int(float(qr_val)))
    except:
        return str(qr_val)

print(normalize_qr("28.0"))
print(normalize_qr(28))
print(normalize_qr("28"))
print(normalize_qr("QR123"))
