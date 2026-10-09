// SERES Cookbook - Supabase REST + Auth integration (publishable key only).
(()=>{
const BASE='https://nxghahtdzflqdotdbqkw.supabase.co';
const KEY='sb_publishable_pfZwCMcyoWYEiFsGyRQKzw_mbzzCw7a';
let session=null, status='연결 중';
const baseHeaders=()=>({'apikey':KEY,'Content-Type':'application/json'});
async function api(path,options={},auth=false){
 const headers={...baseHeaders(),...(options.headers||{})};
 if(auth){if(!session?.access_token)throw Error('관리자 로그인이 필요합니다.');headers.Authorization='Bearer '+session.access_token}
 const res=await fetch(BASE+path,{...options,headers,cache:'no-store'});
 if(!res.ok){let message=await res.text();try{const j=JSON.parse(message);message=j.message||j.msg||j.error_description||message}catch{}throw Error(res.status+' '+message)}
 if(res.status===204)return null;const body=await res.text();return body?JSON.parse(body):null;
}
async function login(email,password){const r=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});session=r;return r}
async function isAdmin(){const rows=await api('/rest/v1/admins?select=user_id&limit=1',{},true);return rows?.length>0}
function loginUI(){return new Promise(resolve=>{
 const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:#0009;display:grid;place-items:center;padding:16px';
 overlay.innerHTML=`<form style="background:#fffdf6;color:#273321;padding:25px;border-radius:15px;width:min(420px,95vw);box-shadow:0 15px 40px #0004;display:grid;gap:12px"><h2 style="margin:0">관리자 로그인</h2><p style="margin:0">Supabase에서 만든 관리자 계정으로 로그인해 주세요.</p><input type="email" required placeholder="관리자 이메일" autocomplete="username" style="padding:12px;border:1px solid #bbb;border-radius:8px"><input type="password" required placeholder="비밀번호" autocomplete="current-password" style="padding:12px;border:1px solid #bbb;border-radius:8px"><p data-error style="color:#b22;margin:0"></p><div style="display:flex;gap:8px"><button type="submit" style="padding:11px;background:#526c48;color:white;border:0;border-radius:8px;flex:1">로그인</button><button type="button" data-cancel style="padding:11px;border:1px solid #aaa;border-radius:8px">취소</button></div></form>`;
 document.body.appendChild(overlay);const f=overlay.querySelector('form');const finish=v=>{overlay.remove();resolve(v)};overlay.querySelector('[data-cancel]').onclick=()=>finish(false);
 f.onsubmit=async e=>{e.preventDefault();const btn=f.querySelector('[type=submit]');btn.disabled=true;try{await login(f.querySelector('[type=email]').value,f.querySelector('[type=password]').value);if(!await isAdmin()){session=null;throw Error('관리자 권한이 없는 계정입니다.')}finish(true)}catch(err){f.querySelector('[data-error]').textContent=err.message;btn.disabled=false}};
 })}
async function requireAdmin(){if(session?.access_token){try{if(await isAdmin())return true}catch{session=null}}return loginUI()}
async function loadPublic(){const [r,s]=await Promise.all([api('/rest/v1/recipes?select=id,data&order=id.asc&limit=1000'),api('/rest/v1/site_settings?select=key,value')]);status='Supabase 연결됨';return {recipes:r.map(x=>x.data),settings:Object.fromEntries(s.map(x=>[x.key,x.value]))}}
async function saveRecipe(recipe){await api('/rest/v1/recipes?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:String(recipe.id),data:recipe,updated_at:new Date().toISOString()})},true)}
async function deleteRecipe(id){await api('/rest/v1/recipes?id=eq.'+encodeURIComponent(id),{method:'DELETE'},true)}
async function saveSetting(key,value){await api('/rest/v1/site_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({key,value,updated_at:new Date().toISOString()})},true)}
async function saveAllRecipes(items){for(let i=0;i<items.length;i+=30){const batch=items.slice(i,i+30).map(r=>({id:String(r.id),data:r,updated_at:new Date().toISOString()}));await api('/rest/v1/recipes?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(batch)},true)}}
async function replaceAllRecipes(items){const existing=await api('/rest/v1/recipes?select=id&limit=1000',{},true);await saveAllRecipes(items);const ids=new Set(items.map(r=>String(r.id)));for(const row of existing){if(!ids.has(row.id))await deleteRecipe(row.id)}}
async function addSeedButton(){if(document.getElementById('seedCloud'))return;const btn=document.createElement('button');btn.id='seedCloud';btn.textContent='최초 요리 106개 서버에 등록';btn.type='button';btn.style.cssText='display:block;margin:12px;padding:10px 16px;border-radius:8px;background:#526c48;color:white;border:0;cursor:pointer';btn.onclick=async()=>{if(!confirm('현재 화면의 요리 목록을 Supabase에 등록할까요? 기존 서버 요리는 같은 ID만 갱신됩니다.'))return;btn.disabled=true;try{await saveAllRecipes(window.DEFAULT_RECIPES||[]);alert('기본 요리 '+(window.DEFAULT_RECIPES||[]).length+'개가 등록됐어요! 페이지를 새로고침해 주세요.')}catch(err){alert('등록 실패: '+err.message)}finally{btn.disabled=false}};document.getElementById('adminDialog')?.prepend(btn)}
function showStatus(){let e=document.getElementById('cloudStatus');if(!e){e=document.createElement('span');e.id='cloudStatus';e.style.cssText='font-size:11px;opacity:.75;margin-left:8px';document.querySelector('.topinner')?.appendChild(e)}e.textContent=status}
window.SeresCloud={requireAdmin,loadPublic,saveRecipe,deleteRecipe,saveSetting,saveAllRecipes,replaceAllRecipes,showStatus,addSeedButton};
})();
