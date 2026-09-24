const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "9dc502d4ef06b3b5374591de6e6933ca";
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "c9e6c93451c3c2e107a1eca511bedaba";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const WORKER = "putduk-web";
const HOSTS = ["putduk.com", "www.putduk.com"];
if (ACCOUNT_ID !== "9dc502d4ef06b3b5374591de6e6933ca") throw new Error("Refusing non-PUTDUK Cloudflare account");
if (ZONE_ID !== "c9e6c93451c3c2e107a1eca511bedaba") throw new Error("Refusing non-putduk.com zone");
if (!TOKEN) throw new Error("CLOUDFLARE_API_TOKEN is required");
const base = "https://api.cloudflare.com/client/v4";
const headers = { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" };
async function api(path, init={}) {
 const res = await fetch(base+path, { ...init, headers:{...headers,...(init.headers||{})}});
 const data = await res.json().catch(()=>({}));
 if (!res.ok || data.success === false) throw new Error(`Cloudflare ${init.method||"GET"} ${path} failed: ${res.status} ${JSON.stringify(data.errors||data)}`);
 return data.result;
}
for (const hostname of HOSTS) {
 const domains = await api(`/accounts/${ACCOUNT_ID}/workers/domains?zone_id=${ZONE_ID}&hostname=${encodeURIComponent(hostname)}`);
 for (const d of domains || []) {
   if (d.service !== WORKER) {
     console.log(`[cf-domain] detaching ${hostname} from ${d.service}`);
     await api(`/accounts/${ACCOUNT_ID}/workers/domains/${d.id}`, {method:"DELETE"});
   }
 }
 const current = await api(`/accounts/${ACCOUNT_ID}/workers/domains?zone_id=${ZONE_ID}&hostname=${encodeURIComponent(hostname)}&service=${WORKER}`);
 if (!(current || []).length) {
   console.log(`[cf-domain] attaching ${hostname} -> ${WORKER}`);
   await api(`/accounts/${ACCOUNT_ID}/workers/domains`, {method:"PUT", body:JSON.stringify({hostname,service:WORKER})});
 }
 const verify = await api(`/accounts/${ACCOUNT_ID}/workers/domains?zone_id=${ZONE_ID}&hostname=${encodeURIComponent(hostname)}`);
 const match=(verify||[]).find(d=>d.service===WORKER);
 if (!match) throw new Error(`custom domain verification failed: ${hostname}`);
 console.log(`[cf-domain] READY ${hostname} -> ${WORKER}`);
}
