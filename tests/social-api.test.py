# Integration test: creates isolated QA profiles on the live social service. No player accounts are used.
import urllib.request,urllib.error,json,uuid
base='https://godforged-online-colton.jocundfrog24.chatgpt.site'
def call(path,data=None,token=None,expect=200):
 import subprocess
 args=['curl','-sS','--max-time','30','-w','\n%{http_code}',base+path,'-H','Origin: https://eazybetz.github.io','-H','Content-Type: application/json']
 if token:args+=['-H','Authorization: Bearer '+token]
 if data is not None:args+=['--data-binary','@-']
 proc=subprocess.run(args,input=json.dumps(data) if data is not None else '',text=True,capture_output=True)
 raw,code=proc.stdout.rsplit('\n',1);status=int(code)
 try:body=json.loads(raw)
 except:raise RuntimeError((status,raw[:100]))
 assert status==expect,(path,status,body)
 return body
pw='Test-'+str(uuid.uuid4())
a=call('/register',{'name':'QA Host','password':pw});b=call('/register',{'name':'QA Guest','password':pw});c=call('/register',{'name':'QA Outsider','password':pw});
at=a['token'];bt=b['token'];ct=c['token'];aid=a['profile']['id'];bid=b['profile']['id']
assert aid!=bid
assert call('/profile',{'name':'QA Renamed'},at)['id']==aid
assert call('/login',{'code':aid,'password':pw})['profile']['id']==aid
call('/messages',{'code':bid,'body':'blocked before friendship'},at,403)
call('/friends',{'code':bid,'action':'request'},at)
call('/friends',{'code':aid,'action':'accept'},bt)
call('/messages',{'code':bid,'body':'QA delivery check'},at)
assert call('/messages?code='+aid,token=bt)[0]['body']=='QA delivery check'
call('/messages?code='+aid,token=ct,expect=403)
r=call('/invite',{'code':bid},at)
call('/room',{'id':r['id'],'action':'read'},ct,404)
call('/room',{'id':r['id'],'action':'accept'},bt)
call('/room',{'id':r['id'],'action':'signal','sdp':'QA test only'},at)
assert call('/room',{'id':r['id'],'action':'read'},bt)['offer']=='QA test only'
call('/room',{'id':r['id'],'action':'leave'},at)
call('/friends',{'code':aid,'action':'block'},bt)
call('/messages',{'code':bid,'body':'blocked'},at,403)
call('/friends',{'code':aid,'action':'unblock'},bt)
for t in [at,bt,ct]:call('/logout',{},t)
call('/me',token=at,expect=401)
print('PASS: online registration, stable code on rename/login, friend acceptance, PM delivery, outsider isolation, party signaling, blocking, logout.')
