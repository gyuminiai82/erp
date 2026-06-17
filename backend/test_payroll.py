import urllib.request, json, urllib.error
req = urllib.request.Request('http://localhost:8000/api/auth/login', data=b'username=admin@minstudio.com&password=password123')
token = json.loads(urllib.request.urlopen(req).read())['access_token']
req2 = urllib.request.Request('http://localhost:8000/api/payrolls/generate', data=b'{"payment_month":"2026-06"}', headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token})
try:
    print(urllib.request.urlopen(req2).read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
