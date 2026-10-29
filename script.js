const STORAGE_KEY = "freshtrack_items_v1";
const HISTORY_KEY = "freshtrack_history_v1";
const $ = id => document.getElementById(id);
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return toISO(d); };
function toISO(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function dateAfter(days){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+days);return toISO(d);}
function daysLeft(date){return Math.round((new Date(date+"T00:00:00")-new Date(today()+"T00:00:00"))/86400000);}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function safeText(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
const emoji={"Vegetables":"🥦","Fruits":"🍎","Dairy":"🥛","Grains & bakery":"🍞","Cooked food":"🍲","Other":"🥫"};
let items=[],history=[];
function loadData(){
  try{items=JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{items=[]}
  try{history=JSON.parse(localStorage.getItem(HISTORY_KEY))||[]}catch{history=[]}
  if(!localStorage.getItem(STORAGE_KEY)){
    items=[
      {id:uid(),name:"Tomatoes",category:"Vegetables",quantity:500,unit:"g",storage:"Fridge",expiry:dateAfter(1)},
      {id:uid(),name:"Milk",category:"Dairy",quantity:1,unit:"litres",storage:"Fridge",expiry:dateAfter(2)},
      {id:uid(),name:"Spinach",category:"Vegetables",quantity:250,unit:"g",storage:"Fridge",expiry:dateAfter(5)},
      {id:uid(),name:"Apples",category:"Fruits",quantity:4,unit:"items",storage:"Fridge",expiry:dateAfter(10)},
      {id:uid(),name:"Cooked rice",category:"Cooked food",quantity:2,unit:"servings",storage:"Fridge",expiry:dateAfter(0)}
    ];saveData();
  }
}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(items));localStorage.setItem(HISTORY_KEY,JSON.stringify(history));}
function status(item){const d=daysLeft(item.expiry);return d<0?"expired":d<=3?"soon":"fresh";}
function dateText(date){const d=daysLeft(date);if(d<0)return `${Math.abs(d)} day(s) overdue`;if(d===0)return "Use today";if(d===1)return "1 day left";return `${d} days left`;}
function weightKg(item){const q=Number(item.quantity);if(item.unit==="kg")return q;if(item.unit==="g")return q/1000;if(item.unit==="litres")return q;return q*.15;}
function render(){
  renderStats();renderInventory();renderMeals();renderProgress();
}
function renderStats(){
  const rescued=history.filter(h=>h.action==="used"||h.action==="donated");
  const kg=rescued.reduce((sum,h)=>sum+Number(h.kg||0),0);
  $("total").textContent=items.length;
  $("soon").textContent=items.filter(i=>status(i)==="soon").length;
  $("rescued").textContent=rescued.length;
  $("saved").textContent=kg.toFixed(1)+" kg";
}
function renderInventory(){
  const query=$("search").value.trim().toLowerCase(),filter=$("filter").value;
  const list=items.filter(i=>(i.name.toLowerCase().includes(query)||i.category.toLowerCase().includes(query))&&(filter==="all"||status(i)===filter)).sort((a,b)=>a.expiry.localeCompare(b.expiry));
  if(!list.length){$("foodList").innerHTML='<div class="empty"><span>🧺</span>No matching food items. Add an item to start tracking.</div>';return;}
  $("foodList").innerHTML=list.map(i=>{
    const s=status(i),label=s==="expired"?"Past date":s==="soon"?"Use soon":"Fresh";
    const formatted=new Date(i.expiry+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
    return `<article class="food-row"><div class="food-emoji">${emoji[i.category]||"🥫"}</div><div><div class="food-name">${safeText(i.name)}</div><div class="food-meta">${safeText(i.quantity)} ${safeText(i.unit)} · ${safeText(i.storage)}<br>Use by ${formatted} · ${dateText(i.expiry)}</div></div><div class="food-right"><span class="status ${s}">${label}</span><div class="row-actions"><button class="mini" data-action="edit" data-id="${i.id}">Edit</button><button class="mini" data-action="used" data-id="${i.id}">✓ Used</button><button class="mini" data-action="donated" data-id="${i.id}">♡ Donate</button><button class="mini red" data-action="wasted" data-id="${i.id}">Waste</button></div></div></article>`;
  }).join("");
}
function renderMeals(){
  const soon=items.filter(i=>status(i)!=="fresh"),categories=new Set(soon.map(i=>i.category));let ideas=[];
  if(categories.has("Vegetables"))ideas.push(["🥣","Quick vegetable soup","Use vegetables that need attention in a simple soup."]);
  if(categories.has("Fruits"))ideas.push(["🥤","Fruit smoothie","Blend ripe fruit with milk or yoghurt."]);
  if(categories.has("Dairy"))ideas.push(["🥞","Pancakes or oats","Use milk in breakfast before it spoils."]);
  if(categories.has("Grains & bakery"))ideas.push(["🥪","Toast or croutons","Use bread for toast, sandwiches, or croutons."]);
  if(categories.has("Cooked food"))ideas.push(["🍚","Leftover rice bowl","Reheat stored rice safely and add vegetables."]);
  if(!ideas.length)ideas=[["📝","Plan your next meal","Check your inventory and use older items first."]];
  $("mealIdeas").innerHTML=ideas.slice(0,4).map(a=>`<div class="meal"><span class="meal-icon">${a[0]}</span><div><b>${a[1]}</b><p>${a[2]}</p><span class="tag">Waste less · Eat smart</span></div></div>`).join("");
}
function renderProgress(){
  const count=history.filter(h=>(h.action==="used"||h.action==="donated")&&h.date>=dateAfter(-6)).length;
  const pct=Math.min(100,count*10);
  $("progressBar").style.width=pct+"%";$("goal").textContent=`${count} / 10`;
  $("percent").textContent=pct+"%";$("donut").style.background=`conic-gradient(#3c9b54 0 ${pct*3.6}deg,#e9eee4 ${pct*3.6}deg 360deg)`;
  $("progressTitle").textContent=count>=10?"Weekly goal reached!":"Keep going!";
  $("progressText").textContent=count>=10?"Amazing work — you rescued 10 items this week.":"You have rescued "+count+" item(s) this week. Mark food as used or donated to track progress.";
}
function openDialog(item=null){
  $("foodForm").reset();$("itemId").value=item?.id||"";$("dialogTitle").textContent=item?"Edit food item":"Add food item";
  $("name").value=item?.name||"";$("category").value=item?.category||"Vegetables";$("quantity").value=item?.quantity??1;
  $("unit").value=item?.unit||"items";$("storage").value=item?.storage||"Fridge";$("expiry").value=item?.expiry||dateAfter(3);
  $("foodDialog").showModal();
}
function closeDialog(){$("foodDialog").close();}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>el.classList.remove("show"),2300);}
$("addTop").addEventListener("click",()=>openDialog());$("addMain").addEventListener("click",()=>openDialog());
$("closeDialog").addEventListener("click",closeDialog);$("cancelDialog").addEventListener("click",closeDialog);
$("search").addEventListener("input",renderInventory);$("filter").addEventListener("change",renderInventory);
$("foodForm").addEventListener("submit",e=>{
  e.preventDefault();const id=$("itemId").value;
  const item={id:id||uid(),name:$("name").value.trim(),category:$("category").value,quantity:Number($("quantity").value),unit:$("unit").value,storage:$("storage").value,expiry:$("expiry").value};
  if(!item.name||!item.expiry)return;
  if(id){items=items.map(old=>old.id===id?item:old);showToast("Food item updated.");}
  else{items.push(item);showToast("Food item added to your inventory.");}
  saveData();closeDialog();render();
});
$("foodList").addEventListener("click",e=>{
  const btn=e.target.closest("button[data-action]");if(!btn)return;
  const item=items.find(i=>i.id===btn.dataset.id);if(!item)return;
  const action=btn.dataset.action;
  if(action==="edit"){openDialog(item);return;}
  if(action==="wasted"&&!confirm(`Record ${item.name} as wasted?`))return;
  if(action==="used"||action==="donated"||action==="wasted"){
    history.push({id:uid(),name:item.name,action,kg:weightKg(item),date:today()});
    items=items.filter(i=>i.id!==item.id);saveData();render();
    showToast(action==="used"?`${item.name} marked as used.`:action==="donated"?`${item.name} marked as donated.`:`${item.name} recorded as wasted.`);
  }
});
loadData();render();
