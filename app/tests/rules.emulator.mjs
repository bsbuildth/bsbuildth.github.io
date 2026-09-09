import { readFileSync } from 'node:fs';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
let env, admin, user, guest;
before(async () => {
 env=await initializeTestEnvironment({projectId:'demo-bsbuildth',firestore:{host:'127.0.0.1',port:8080,rules:readFileSync('firestore.rules','utf8')}});
 admin=env.authenticatedContext('owner',{admin:true}).firestore();user=env.authenticatedContext('normal').firestore();guest=env.unauthenticatedContext().firestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();await setDoc(doc(db,'articles','public'),{is_visible:1,slug:'public'});await setDoc(doc(db,'articles','draft'),{is_visible:0,slug:'draft'});
  await setDoc(doc(db,'contacts','private'),{name:'Example'});
 });
});
after(async()=>{await env?.cleanup();});
test('guest only reads published content; ordinary account has no admin access',async()=>{
 await assertSucceeds(getDoc(doc(guest,'articles','public')));await assertFails(getDoc(doc(guest,'articles','draft')));
 await assertFails(getDocs(collection(guest,'articles')));await assertSucceeds(getDocs(query(collection(guest,'articles'),where('is_visible','in',[true,1]))));
 for(const db of [guest,user]){await assertFails(getDoc(doc(db,'contacts','private')));await assertFails(setDoc(doc(db,'articles','write'),{is_visible:1}));await assertFails(getDocs(collection(db,'quotations')));}
 await assertSucceeds(getDoc(doc(admin,'contacts','private')));
});
test('contact schema rejects oversize and additional fields',async()=>{
 const valid={name:'Example',contact_info:'000',email:'',service_type:'test',message:'',created_at:serverTimestamp()};
 await assertSucceeds(setDoc(doc(guest,'contacts','valid'),valid));await assertFails(setDoc(doc(guest,'contacts','bad'),{...valid,name:'x'.repeat(121)}));
 await assertFails(setDoc(doc(guest,'contacts','extra'),{...valid,admin:true}));
});
test('issuance locks revision and number, supports controlled revision flow',async()=>{
 const ref=doc(admin,'quotations','q1'), quote={number:'QT-TEST',customer:'Example'};
 await assertSucceeds(setDoc(ref,{quote,status:'draft',version:1,revision:0}));
 const batch=writeBatch(admin);batch.update(ref,{status:'issued',version:2,revision:1});batch.set(doc(admin,'quotations','q1','revisions','1'),{quote,revision:1});batch.set(doc(admin,'quotationNumbers','QT-TEST'),{quotationId:'q1'});await assertSucceeds(batch.commit());
 await assertFails(updateDoc(doc(admin,'quotations','q1','revisions','1'),{quote:{number:'changed'}}));
 await assertFails(deleteDoc(doc(admin,'quotations','q1','revisions','1')));
 await assertFails(updateDoc(ref,{quote:{number:'changed'},version:3}));
 await assertFails(setDoc(doc(admin,'quotationNumbers','QT-TEST'),{quotationId:'another'}));
 await assertSucceeds(updateDoc(ref,{status:'draft',version:3,reason:'Correction'}));
 await assertFails(updateDoc(ref,{status:'issued',version:4,revision:2}));
});
