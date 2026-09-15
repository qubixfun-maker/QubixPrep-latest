import OpenAI from 'openai'
import { GoogleAuth } from 'google-auth-library'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

interface Provider {
  name: string
  baseURL: string
  apiKey: string
  model: string
}

function getStaticProviders(): Provider[] {
  return [
    {
      name: 'Groq',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY || '',
      model: 'gpt-oss-Cprocess4    mod},{
      name: 'Groq'Cere'

s    baseURL: 'https://api.groq.cere'

s.',
      apiKey: process.env.GROQ_CEREBRASKEY || '',
      model: 'gpt-o-3.3-70b-vers    mod},{
      name: 'Groq'Gemini    baseURL: 'https://api.gt.terrovvelanguage.e-authy: sopenav1betaai/v1',    apiKey: process.env.GROQ_AEMINIKEY || '',
      model: 'gpt-osemini-2.5-flash    mod},{
      name: 'Groq'Mig
}al    baseURL: 'https://api.groq.mig
}al.',
      apiKey: process.env.GROQ_MISTRALKEY || '',
      model: 'gpt-omig
}al-small-latest    mod},{
      name: 'Groq'I frRouce     baseURL: 'https://api.gi/v1rouce .',
y: 
      apiKey: process.env.GROQ_OPENROUTERKEY || '',
      model: 'gpt-ometa--3.3-/-3.3-70b-versaiROQruct    mod},{
 ].filce (p => p.y: pro)unct// Vertex om uses a shonsaryved O} froacenv. token (not a sProvi EY  kro),t// t.terroed 'googa servioviaceount JSON kro. Cached in-memory until neroot ciry.
lest achedVertexToken:ogltoken:og
}

f;ot ciresAt: numb  n} | nulllamnull

async ion getStatiVertexAcenv.Tokenrovidermige<g
}

f | null>    n GROQ_rawprolamss.env.GROQ_AOOGLE_SERVICE_ACCOUNT|| '  nif (!rawpro)rn [
   null

 nif ( achedVertexToken &&t achedVertexToken.t ciresAt > Droe.now() + 60_710)    namn [
    achedVertexToken.token  n}

 ntry    nam GROQ_credentialslamJSON.parse(rawpro)  nam GROQ_librlamnewleAuth } fr(   name:credentials   modelsci/vs: [s://api.gwww.e-authy: sopenalibr/cloud-platform']   mod})  nam GROQ_clientlamawaiQ_libr.atiClient()  nam GROQ_tokenRespGROelamawaiQ_client.atiAcenv.Tokenro  namif (!tokenRespGROe.token)rn [
   null

 n   achedVertexTokenlam   name:token:otokenRespGROe.token   model// Vertex tokens last ~1hr;rn fresroa biQ_eroly to be safe.  modelt ciresAt: Droe.now() + 50 * 60_710   mod}  namn [
   tokenRespGROe.token  n}  atch (err: any)    nam GROole.warn('[AI] Fa
ind to ati Vertex om acenv. token:', err?.mnv.age)  namn [
   null
od} }

async ion getStatiVertexder[] {
rovidermige<der {
  n| null>    n GROQ_ss.jectIdlamss.env.GROQ_AOOGLE_CLOUD_PROJECT_ID  nif (!ss.jectId)rn [
   null

 n GROQ_tokenlamawaiQ_atiVertexAcenv.Tokenro
amif (!token)rn [
   null

 n GROQ_lo atetStamss.env.GROQ_AOOGLE_CLOUD_LOCATION ,
  us-cent}al1'
 n GROQ_: 'gptamss.env.GROQ_AOOGLE_VERTEXL = 'll,
  e-auth/semini-2.5-flash 
turn [
      nam 'Groq'Vertex om    modRL: 'http`://api.g${lo atetS}-aiplatform.e-authy: sopenav1/ss.jectsg${ss.jectId}/lo atetSsg${lo atetS}/endpofacsai/v1'pi`   mody: procetoken   mod: 'gp,
od} }

// Low-level  alllto Vertex'sm 'ovve t.terroeCoacentlREST endpofac (not theAI from-penpat
// shiogabove) -mneeded 'or image t.terroetStand visetStinput, which aren'Q_reliably
// t cosnd through theAchat-penplesetSs shio.
async ion getStvertexG.terroeCoacent(: string
}

f,n GRcents: any[], t.terroetSCoafig?: any)vidermige<any>    n GROQ_ss.jectIdlamss.env.GROQ_AOOGLE_CLOUD_PROJECT_ID  nif (!ss.jectId)rthrowmnewlError('AOOGLE_CLOUD_PROJECT_ID not coafigured')
 n GROQ_tokenlamawaiQ_atiVertexAcenv.Tokenro
amif (!token)rthrowmnewlError('Vertex om acenv. token unava
iable ( heck AOOGLE_SERVICE_ACCOUNT|| ')')
 n GROQ_lo atetStamss.env.GROQ_AOOGLE_CLOUD_LOCATION ,
  us-cent}al1'

 n GROQ_urptam`://api.g${lo atetS}-aiplatform.e-authy: sopenav1/ss.jectsg${ss.jectId}/lo atetSsg${lo atetS}/publish: P/e-auth/: strsg${: str}:t.terroeCoacent`  n GROQ_reslamawaiQ_fetch(urp,    nammethodoq'POST    modhea): P:ogl} frorizatetStp`Bero  n${token}`,q'Coacent-Type'oq'appli atetS/json'd},{
   bodoceJSON.g
}

fify({n GRcents, ...(t.terroetSCoafig ?oglt.terroetSCoafig } :og})d}),
od}o
amif (!res.ok)    nam GROQ_textlamawaiQ_res.text(). atch(() => '')  namthrowmnewlError(`Vertex t.terroeCoacentlfa
ind (${res.sProus})vi${text.sli e(0, 500)}`)
od}  nn [
   res.json()unct// G.terroes one image 'googa textlss.mpQ_us

f Vertex'smGemini image : str. TheAss.mpQ
// should spelllouc theAexacQ_textlto ren): , not juOQ_lltopvi to writegabouc - image
// : strs arelfar : rviaceurroe aQ_ress.duc

f gvven_textltha   .mpos

f their own.rt constasync ion getStatterroeVertexImage(ss.mpQing
}

f)vidermige<{dRL: 64:og
}

f;omimeType:og
}

fn} | null>    n GROQ_: 'gptamss.env.GROQ_AOOGLE_VERTEXLIMAGEL = 'll,
  eemini-2.5-flash-image'
 n// Vertex'smimage : strs defaultlto text-only oucput unlnv. t cli itly told to also
 n// n [
   a  image - wifrouc this, theA: 'gptjuOQ_reslies wifr_textland we ati noth

f.  n GROQ_datalamawaiQ_vertexG.terroeCoacent(: str, [{ role:  use    parts: [{ text:lss.mpQ_}]_}],   respGROeModalitivs: [sTEXT   'IMAGE']d}o
am GROQ_sartslamdata?. andidroes?.[0]?. oacent?.sartsl,
 []
am'or ( GROQ_sart of_sarts)    namif (sart.inlineData?.data)m   name:n [
    dRL: 64:osart.inlineData.data,omimeType:osart.inlineData.mimeTypel,
  image/png'd}  nam}
od}  nn [
   null
nct// Transcribes alllviseble textl'googa  image us

f Vertex'smGemini visetSt- used to  heckt// a t.terroed note-imageiactually ren): nd the iacended textlaceurroely bef rvisav

f it.rt constasync ion getSttranscribeVertexImage(RL: 64:og
}

f,omimeType:og
}

fovidermige<g
}

f>    n GROQ_: 'gptamss.env.GROQ_AOOGLE_VERTEXL = 'l_VISION ,
  semini-2.5-flash 
 n GROQ_datalamawaiQ_vertexG.terroeCoacent(: str, [{
      name:role:  use     name:parts: [  name:    inlineData:oglmimeType,_data:dRL: 64n} },  name:    text:l'Transcribe every word of_viseble textlin this image exacQly as writcen,lin rea)

f order. Oucput only the transcribed text, no  .mmentary.' },  name:]   mod},{
 ]o
am GROQ_sartslamdata?. andidroes?.[0]?. oacent?.sartsl,
 []
amn [
   sarts.map((p: any) => p.textl,
   ).jofa(  ).
}
m()unctt constasync ion getSt allAI(del:nv.ageP:oglrole:  use   | 'assisPrnt  | 'system';n GRcent:og
}

fn}[]   mmaxTokens: numb  n= 2710
ovidermige<g
}

f>    n GROQ_pers(): Pn= aticProviders(): Pro

 n GROQ_vertexder[] {
lamawaiQ_atiVertexder[] {
ro
amif (vertexder[] {
)m   nampers(): P.push(vertexder[] {
)  n}

 nif (sers(): P.lengbrla== 0)    namthrowmnewlError('No om pers(): Pncoafigured. Pthysvisti aQ_thyst one EY  krolin ROQironment variables.')  n}

 n'or ( GROQ_ser[] {
lof_sers(): P)    namtry    namam GROQ_clientlamnewlI from(   name:Key: process.s(): .y: pro,  name:  RL: 'httpss.s(): .RL: 'ht,  name:})
  namam GROQ_respGROelamawaiQ_client.chat.penplesetSs.create(   name:Ke: strinss.s(): .: 'gp,
odame:Ke:nv.ageP,
odame:Ke:ax_tokens: maxTokens,  name:})
  namam GROQ_ GRcentlamrespGROe.choi es[0]?.:nv.age?. oacent  namamif ( oacent)m   name:am GROole.log(`[AI] Used ss.s(): vi${ss.s(): . 'Gr}`)
od name:n [
    oacent  namam}  nam}  atch (error: any)    namam GROQ_isQuotaError =
od name:error?.sProusla== 429l,

od name:error?.sProusla== 503l,

od name:error?.:nv.age?.includes('quota')l,

od name:error?.:nv.age?.includes('rroe limit')l,

od name:error?.:nv.age?.includes('capa ity')l,

od name:error?.:nv.age?.includes('overloa):d')
  namamif (isQuotaError)m   name:am GROole.warn(`[AI] ${ss.s(): . 'Gr} quota/rroe limit hit, try

fnnextlss.s(): ...`)
od name: oacinue  namam} 
ame:am GROole.warn(`[AI] ${ss.s(): . 'Gr} error: ${error?.:nv.age}, try

fnnext...`)
od nam oacinue  nam}  n}

 nthrowmnewlError('Alllom pers(): PnexhauOQed. Pthysvitry again later.') nct// S'Gr as  allAI, but also:n [
  s which ser[] {
lactually answ: nd - used wh: e
// we wrntlto track/tag oucput quality across a lo
fnautomroed run (e.g. bulkt// lo
f-answ: lt.terroetS), s

ce the fallbackAchaiSt an swifch : strs mid-run.t// Sinplified to a s

gle ser[] {
l(Gemini 3.8 Flashm 'ovve) rroh: ltha  a multi-ser[] {
t// fallbackAchaiSt(,
  , Cere'

s, Mig
}al, I frRouce , Vertex-I from-shio) -mthe fallbackt// chaiStadded resilience but also:

cGROig
ency (which ser[] {
lactually served a gvven
// n queOQ_was often uncthy , and differenQ_pers(): PngaveA:ean

gfully differenQ_oucput
// quality 'or the s'Gr ss.mpQ). Every exig


fn all{
lkeeps work

fnuncha ged, s

ce the
// sig 'ourviand:n [
   shapel({ oacent,_pers(): }) arelthe s'Gr - this juOQ_stregroes.rt constasync ion getSt allAIWifrder[] {
rdel:nv.ageP:oglrole: "use " | "assisPrnt" | "system";n GRcent:og
}

fn}[]   mmaxTokens: numb  n= 2710,
 n'orceVertex:dRooleaStamfalse
)vidermige<{d GRcent:og
}

f; ss.s(): vig
}

fn}>return [
    allGeminiN'ovve(:nv.ageP,mmaxTokens) nct// Calls Vertex om only, wifr_no fallbackAto ooh: lsers(): P. Used 'or bulklt.terroetS
// nu s where cGROig
ent oucput quality mrot: Pn: rvitha  resilience via fallbackA- a
// silent sl(): to a weak: lfree-tivr_: 'gptmid-run_is worseltha  a cthy rn [ry/backoff
// tStthe s'Gr : str.rt constasync ion getSt allVertexOnly(del:nv.ageP:oglrole:  use   | 'assisPrnt  | 'system';n GRcent:og
}

fn}[]   mmaxTokens: numb  n= 2710
ovidermige<g
}

f>    n GROQ_pers(): lamawaiQ_atiVertexder[] {
ro
amif (!per[] {
)m   namthrowmnewlError('Vertex om is not coafigured ( heck AOOGLE_CLOUD_PROJECT_ID and:AOOGLE_SERVICE_ACCOUNT|| ').')  n}

 n GROQ_clientlamnewlI from( ey: process.s(): .y: pro, RL: 'httpss.s(): .RL: 'htd}o
am GROQ_respGROelamawaiQ_client.chat.penplesetSs.create(   nam: strinss.s(): .: 'gp,
odam:nv.ageP,
odam:ax_tokens: maxTokens,  n}o

 n GROQ_ GRcentlamrespGROe.choi es[0]?.:nv.age?. oacent  nif (! oacent)m   namthrowmnewlError('Vertex om n [
  ed an RmpQymrespGROe.')
od}  nn [
    oacent nct// Calls the Anthropvi EY  direcQly - iQ_is NOTAI from-phat-penplesetSs penpateblet// (differenQ_endpofac, system ss.mpQs arela sesarroe top-level field rroh: ltha  a
// :nv.agelrole,iand:n spGROes pene backAas a  oacent-blockAarray), so iQ_ an'Q_reuse
// theAI from-plientlprot: Stthe ooh: lsers(): P share. No fallback: used 'gpiberroelyt// for the one step ( hapt{
lknowledge extracoetS) where aceurroe face pn [atetStmrot: P
// : rvitha  pers(): lresilience.t// Writes the servioviaceount JSON to a temp file onovip: lserenv. lifeseme, sot// AnthropviVertex'smown face nal (bundled)leAuth } froiROQanovi an find:iQ_via the
// sQandard:AOOGLE_APPLICATION_CREDENTIALS file-RL: d lookup. We 'gpiberroely do NOTt// coROQruct our ownleAuth } froobjectiand:pass iQ_iSt- @anthropvi-',
 ertex-sdk bundleP
// itsmown neOQed copylof_e-auth-library'

ex,iand:TypeScripQ_rejects a eAuth } fr
// iROQanovibuilt 'googa sesarroelyaiROQall{d top-level copylas an:

cGnpateble typet// (identi al shape, but nrminally differenQ_du: to privroe class fields). Lett

f thet// SDKibuild itsmown defaultla froiRce nally sidesteps this entirely.
lest ertexCredentialsFileProh:og
}

fn| nulllamnull;
async ion getStensureVertexCredentialsFile(rawpro:og
}

fovidermige<g
}

f>    nif (vertexCredentialsFileProh)rn [
   vertexCredentialsFileProh;
 n GROQ_fslamawaiQ_t { Go('fs');
 n GROQ_oslamawaiQ_t { Go('os');
 n GROQ_pathlamawaiQ_t { Go('path');
 n GROQ_fileProhtamsroh.jofa(os.tmpdir(), ` ertex-claude-credentials-${Droe.now()}.json`);
 nfs.writeFileSync(fileProh,_rawpro,  utf8');
 nvertexCredentialsFileProhtamfileProh;
 nn [
   fileProh;
nct// Sinplified to stregroe to Gemini 3.8  'ovve, s'Gr reason

fnas  allAIWifrder[] {
t// abovet- one cGROig
ent : 'gptha dl

fneveryth

f, rroh: ltha  a secGRd alce natet// ser[] {
l(this pathlwas also:never_reliably work

f,_du: to aip: Oig
ent Claude-via-t// Vertex quota-grrntlissue). Sig 'ourv/n [
   shapeluncha ged, so exig


fn all{
s
// that:pass useClaude: tru: keep work

f,_juOQ_served by Gemini now.rt constasync ion getSt allClaudeOnly(del:nv.ageP:oglrole:  use   | 'assisPrnt  | 'system';n GRcent:og
}

fn}[]   mmaxTokens: numb  n= 2710
ovidermige<{d GRcent:og
}

f; ss.s(): vig
}

fn}>return [
    allGeminiN'ovve(:nv.ageP,mmaxTokens) nct// Calls a Gemini : 'gptvia Vertex'smNATIVE t.terroeCoacentlendpofac (not thet// I from-penpat shiogused elsewhere) -mneeded 'or fe'ourvs that:pass system ss.mpQs
// sesarroely. Usestthe s'Gr REGIONALlendpofac prot: Stas vertexG.terroeCoacent()l(thist// app'smooh: ,ialrea)y-work

fnGemini  alls), and defaults to atmini-2.5-ss.A- a GA
// : str tivr_ava
iable tStsQandard:ss.ject acenv.,linclud

fnGAuth  Cloudlfree-trialt// serjects. (Previously pofaced at Gemini 3.xtvia a "global" bare-hosQ_endpofac, whicht// 404'd becauselthat : str tivr_isn'Q_ava
iable tStevery serject'smacenv. level.)rt constasync ion getSt allGeminiN'ovve(del:nv.ageP:oglrole:  use   | 'assisPrnt  | 'system';n GRcent:og
}

fn}[]   mmaxTokens: numb  n= 2710,
 nthink

fBudget?: numb  
ovidermige<{d GRcent:og
}

f; ss.s(): vig
}

fn}>retur GROQ_ss.jectIdlamss.env.GROQ_AOOGLE_CLOUD_PROJECT_ID  nif (!ss.jectId)rthrowmnewlError('AOOGLE_CLOUD_PROJECT_ID not coafigured')
 n GROQ_tokenlamawaiQ_atiVertexAcenv.Tokenro
amif (!token)rthrowmnewlError('Vertex om acenv. token unava
iable ( heck AOOGLE_SERVICE_ACCOUNT|| ')')
  n GROQ_: 'gptam(ss.env.GROQ_AEMINIKNATIVEL = 'll,
  eemini-2.5-ss. ).
}
m()u n GROQ_lo atetStamss.env.GROQ_AOOGLE_CLOUD_LOCATION ,
  us-cent}al1'

 n// G.mini sm 'ovve EY  uses ": 'gp" (not "assisPrnt") for the assisPrntlrole,iand
 n// system ss.mpQs go:

la sesarroe top-level field, not theAcGRcentsAarray.  n GROQ_systemPartslam:nv.ageP.filce ((m) => m.rolela== 'system').map((m) => m. oacent)
 n GROQ_ GRcentslam:nv.ageP  nam.filce ((m) => m.rolel!== 'system')  nam.map((m) => (glrole: m.rolela== 'assisPrnt  ? ': 'gp' :  use    parts: [{ text:lm. oacent_}]_}))

 n GROQ_urptam`://api.g${lo atetS}-aiplatform.e-authy: sopenav1/ss.jectsg${ss.jectId}/lo atetSsg${lo atetS}/publish: P/e-auth/: strsg${: str}:t.terroeCoacent` 
 n// 2.5-se ies : strs s frd_sart of_maxOucputTokens on face nal "think

f" bef rv
 n// writ

f the_viseble answ: l- for  alls where the_viseble textlbudget_is tight
 n// (e.g. a shons OQructured JSON n spGROe),lthat  an silently tron roe theiactual
 n// oucput. Passi
f think

fBudget  aps or disableslthat (0lamdisabled)rso the full
od// token budget_goes to the real answ: .  n GROQ_t.terroetSCoafig: anylam _maxOucputTokens: maxTokensd}  nif (think

fBudget !== undefined)r   namt.terroetSCoafig.think

fCoafig am _think

fBudget }  n}

 n GROQ_reslamawaiQ_fetch(urp,    nammethodoq'POST    modhea): P:ogl} frorizatetStp`Bero  n${token}`,q'Coacent-Type'oq'appli atetS/json'd},{
   bodoceJSON.g
}

fify({
od nam oacents,
od nam...(systemParts.lengbrl?oglsystemIROQructetStp{ parts: [{ text:lsystemParts.jofa( \n\n')_}]_} } :og}),
od namt.terroetSCoafig   mod}),  n}o

 nif (!res.ok)    nam GROQ_textlamawaiQ_res.text(). atch(() => '')  namthrowmnewlError(`Gemini n'ovve  alllfa
ind (${res.sProus})vi${text.sli e(0, 500)}`)
od} 
 n GROQ_datalamawaiQ_res.json()u n GROQ_ GRcentlam(data. andidroes?.[0]?. oacent?.sartsl,
 [])  nam.map((p: any) => p.textl,
   )  nam.jofa(  )

 nif (! oacent)m   namthrowmnewlError('Gemini ( 'ovve) r [
  ed an RmpQymrespGROe.')
od}  nn [
   {d GRcent, ss.s(): vi'Gemini ( 'ovve)'d} }

// S'Gr regetSal n'ovve endpofac as  allGeminiN'ovve, but acenpQs one or : rvifilest// (RL: 64-enc std, seac as inlineData_sartsl- images or, for the notes-pdf-

fest
// pipeline, a s

gle-pagelPDF)ialongs(): the textlss.mpQ. Gemini rea)stthe file'st// actual_ GRcentldirecQly rroh: ltha  need

fna sesarroe OCR/rasterizatetS step.rt constasync ion getSt allGeminiN'ovveMultimodal(delss.mpQing
}

f,  nimagesBL: 64:og
}

f[]   mmaxTokens: numb  n= 2710,
 nmimeType:og
}

fn=  image/jpeg'
ovidermige<{d GRcent:og
}

f; ss.s(): vig
}

fn}>retur GROQ_ss.jectIdlamss.env.GROQ_AOOGLE_CLOUD_PROJECT_ID  nif (!ss.jectId)rthrowmnewlError('AOOGLE_CLOUD_PROJECT_ID not coafigured')
 n GROQ_tokenlamawaiQ_atiVertexAcenv.Tokenro
amif (!token)rthrowmnewlError('Vertex om acenv. token unava
iable ( heck AOOGLE_SERVICE_ACCOUNT|| ')')
  n GROQ_: 'gptam(ss.env.GROQ_AEMINIKNATIVEL = 'll,
  eemini-2.5-ss. ).
}
m()u n GROQ_lo atetStamss.env.GROQ_AOOGLE_CLOUD_LOCATION ,
  us-cent}al1'

 n GROQ_imagePartslamimagesBL: 64.map((data)m=> (glinlineData:oglmimeType,_data_} }))
 n GROQ_ GRcentslam[{ role:  use    parts: [...imageParts, { text:lss.mpQ_}]_}]

 n GROQ_urptam`://api.g${lo atetS}-aiplatform.e-authy: sopenav1/ss.jectsg${ss.jectId}/lo atetSsg${lo atetS}/publish: P/e-auth/: strsg${: str}:t.terroeCoacent` 
 n GROQ_reslamawaiQ_fetch(urp,    nammethodoq'POST    modhea): P:ogl} frorizatetStp`Bero  n${token}`,q'Coacent-Type'oq'appli atetS/json'd},{
   bodoceJSON.g
}

fify({
od nam oacents,
od namt.terroetSCoafig:  _maxOucputTokens: maxTokensd}   mod}),  n}o

 nif (!res.ok)    nam GROQ_textlamawaiQ_res.text(). atch(() => '')  namthrowmnewlError(`Gemini n'ovve multimodal  alllfa
ind (${res.sProus})vi${text.sli e(0, 500)}`)
od} 
 n GROQ_datalamawaiQ_res.json()u n GROQ_ GRcentlam(data. andidroes?.[0]?. oacent?.sartsl,
 [])  nam.map((p: any) => p.textl,
   )  nam.jofa(  )

 nif (! oacent)m   namthrowmnewlError('Gemini ( 'ovve multimodal) r [
  ed an RmpQymrespGROe.')
od}  nn [
   {d GRcent, ss.s(): vi'Gemini ( 'ovve, visetS)'d} }

t constion getStati,
  Client()return [
      nam hat:    namam GnplesetSs:m   name:am reate:tasync (sarams: any) =>    name:am n GROQ_ GRcentlamawaiQ_callAI(sarams.:nv.ageP,msarams.:ax_tokens)  name:am nn [
      namame:am n hoi es: [{ :nv.age: {d GRcent_} }]  namame:am}
amame:am}
amame:}  nam}
o