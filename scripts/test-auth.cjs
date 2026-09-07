const fs=require('fs');
const assert=require('node:assert/strict');
const {parseEnv}=require('node:util');
const root=process.cwd();
const env=parseEnv(fs.readFileSync(root+'/.env.local','utf8'));
const jwt=require(root+'/node_modules/jsonwebtoken');
const base='http://localhost:3000';
let checks=0;
async function check(path,status,options={}) {
 const response=await fetch(base+path,{...options,headers:{Origin:'http://localhost:5173',...options.headers}});
 assert.equal(response.status,status,`${options.method||'GET'} ${path}`);
 assert.equal(response.headers.get('access-control-allow-origin'),'http://localhost:5173');
 checks++; console.log('PASS',options.method||'GET',path,status); return response;
}
const json=(body,method='POST',cookie)=>({method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
async function main(){
 await check('/api/me',401);
 for(const method of ['GET','POST']) await check('/api/item',401,{method});
 for(const method of ['GET','PUT','DELETE']) await check('/api/item/000000000000000000000000',401,{method});
 await check('/api/item',401,{headers:{'X-HEADER-USER-ID':'-1'}});
 await check('/api/me',401,{headers:{cookie:'token=invalid'}});
 const expired=jwt.sign({id:'-1',email:'test'},env.JWT_SECRET,{expiresIn:-1});
 await check('/api/me',401,{headers:{cookie:'token='+expired}});
 for(const body of [{},{email:' ',password:' '},{email:{},password:1}]) await check('/api/auth/login',400,json(body));
 const invalid=await check('/api/auth/login',401,json({email:env.ADMIN_USER,password:'wrong-password-for-test'}));
 assert.equal(invalid.headers.get('set-cookie'),null);
 const login=await check('/api/auth/login',200,json({email:env.ADMIN_USER,password:env.ADMIN_PASS}));
 const setCookie=login.headers.get('set-cookie');
 assert.match(setCookie,/HttpOnly/i); assert.match(setCookie,/Path=\//i);
 const cookie=setCookie.split(';')[0];
 const profile=await login.json(); assert.ok(profile.user.email); assert.equal(profile.user.password,undefined);
 const me=await check('/api/me',200,{headers:{cookie}});assert.equal((await me.json()).email,profile.user.email);
 await check('/api/item',200,{headers:{cookie}});
 await check('/api/item',400,json({name:'x',category:'test',price:-1,amount:2},'POST',cookie));
 const created=await check('/api/item',201,json({name:'Authentication smoke test '+Date.now(),category:'Test',price:1,amount:1},'POST',cookie));
 const {id}=await created.json();
 try {
  await check('/api/item/'+id,200,{headers:{cookie}});
  await check('/api/item/'+id,200,json({name:'Authentication smoke test updated',category:'Test',price:2,amount:2},'PUT',cookie));
 } finally {await check('/api/item/'+id,200,{method:'DELETE',headers:{cookie}});}
 await check('/api/item/'+id,404,{headers:{cookie}});
 const logout=await check('/api/auth/logout',200,{method:'POST',headers:{cookie}});
 assert.match(logout.headers.get('set-cookie'),/token=;/);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/i);
 await check('/api/me',401);await check('/api/item',401);
 await check('/api/item',204,{method:'OPTIONS'});
 console.log('TOTAL',checks,'checks passed. Test item was soft-deleted.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
