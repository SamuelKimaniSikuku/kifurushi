const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
}).outputText, filename);
let rows, userId, failurePage, calls;
const client = {
  auth: {getSession: async () => ({data: {session: userId ? {user: {id:userId}} : null}, error:null})},
  from(table) {
    assert.equal(table, 'messages');
    let excluded;
    const chain = {
      select(columns) { assert.equal(columns, 'match_id, created_at'); return chain; },
      neq(key, value) { assert.equal(key, 'sender_id'); excluded = value; return chain; },
      order() { return chain; },
      async range(start, end) {
        calls.push([start,end]);
        if (start === failurePage) return {data:null,error:new Error('Read failed')};
        return {data:rows.filter(r => r.sender_id !== excluded).sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(start,end+1),error:null};
      },
    };
    return chain;
  },
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === './supabase' && parent.filename.endsWith('/lib/chatNotifications.ts')) return {supabase:client};
  return originalLoad.call(this,request,parent,isMain);
};
const {fetchIncomingChatActivity,countUnreadChats} = require('../lib/chatNotifications.ts');
const {readChatMarker,writeChatMarker,CHAT_READ_CHANGED} = require('../lib/inbox.ts');
Module._load = originalLoad;
beforeEach(() => {
  rows=[]; userId='me'; failurePage=-1; calls=[];
  const storage=new Map();
  global.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
  global.window=new EventTarget();
});
const earlier='2026-11-09T10:00:00Z', later='2026-11-10T10:00:00Z';
test('reading the last two conversations clears the badge immediately', () => {
  const activity={'instant-a':earlier,'instant-b':later};
  let badge=countUnreadChats(activity), updates=0;
  window.addEventListener(CHAT_READ_CHANGED,()=>{badge=countUnreadChats(activity);updates++;});
  assert.equal(badge,2);
  writeChatMarker('instant-a',earlier);
  assert.equal(badge,1);
  writeChatMarker('instant-b',later);
  assert.equal(badge,0);
  assert.equal(updates,2);
  assert.equal(countUnreadChats({...activity,'instant-b':'2026-11-10T11:00:00Z'}),1);
});
test('a late snapshot cannot bring back messages already read; read markers never regress', () => {
  writeChatMarker('race',later);
  writeChatMarker('race',earlier);
  assert.equal(readChatMarker('race'),later);
  assert.equal(countUnreadChats({race:earlier}),0);
});
test('the shared read marker also clears the badge when browser storage is unavailable', () => {
  global.localStorage={getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}};
  writeChatMarker('private',later);
  assert.equal(readChatMarker('private'),later);
  assert.equal(countUnreadChats({private:later}),0);
});
test('incoming activity excludes own messages and counts each conversation once', async () => {
  rows=[{match_id:'incoming',sender_id:'other',created_at:earlier},{match_id:'incoming',sender_id:'other',created_at:later},{match_id:'own-only',sender_id:'me',created_at:later}];
  const result=await fetchIncomingChatActivity('me');
  assert.deepEqual(result,{incoming:later});
  assert.equal(countUnreadChats(result),1);
});
test('pagination retains conversations beyond the first page', async () => {
  rows=Array.from({length:501},(_,i)=>({match_id:`page-${i}`,sender_id:'other',created_at:later}));
  const result=await fetchIncomingChatActivity('me');
  assert.equal(Object.keys(result).length,501);
  assert.deepEqual(calls,[[0,499],[500,999]]);
});
test('failed reads never return a partial count as a success', async () => {
  rows=Array.from({length:501},(_,i)=>({match_id:`failed-${i}`,sender_id:'other',created_at:later}));
  failurePage=500;
  await assert.rejects(fetchIncomingChatActivity('me'),/Read failed/);
});
test('signed-out and switched accounts do not load another account’s notification snapshot', async () => {
  userId=null;
  assert.deepEqual(await fetchIncomingChatActivity('me'),{});
  userId='someone-else';
  assert.deepEqual(await fetchIncomingChatActivity('me'),{});
  assert.equal(calls.length,0);
});
