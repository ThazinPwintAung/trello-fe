const endpoint = "https://trello-clone-ppm.herokuapp.com";
var lists = [];
var addListPopup;
var listMenuPopup;
var clickedListId;

const loader = `<div id="loading">
<img id="loading-image" src="img/loading.gif" alt="Loading..." />
</div>`

const logo = `<img id="logo" src="img/logo.png" alt="TrelloLogo" />`

const addListBtn = `<button class="btn btn-lg add-list m-1 text-left mr-3" id="add-list-btn" onclick="addNewList(event)">
<i class="fa fa-plus"></i>&nbsp;&nbsp;&nbsp;Add another list
</button>`

const getLabel = (label) => {
    return `<span class="trello-label d-inline-block mr-1" style="background-color: ${label.color}"></span>`;
};

const getMember = (mem) => {
    const names = mem.name.trim().split(" ");
    let initials = names[0][0];
    if (names.length > 1) {
        initials += names[names.length -1][0];
    } else if (names[0].length > 1) {
        initials += names[0][1];
    }
    initials = initials.toUpperCase();
    return `<div class="avatar">${initials}</div>`;
};

const getCard = (card,list) => {
    const lblStr = card.labels.map(lbl => getLabel(lbl)).join("");
    const memStr = card.members.map(mem => getMember(mem)).join("");
    const cardPaddingTop = lblStr ? "0":"10px";
    return `
    <div class="trello-card d-block mb-2" style="padding-top: ${cardPaddingTop}" data-toggle="modal" data-target="#cardModal" onclick="openCardModal(event)" list-id="${list.id}" card-id="${card.id}">
    ${lblStr}
    <h6 class="trello-title">${card.title}</h6>
    <div class="d-flex flex-wrap justify-content-between align-items-end">
      <div class="d-flex flex-nowrap align-items-center">
        ${card.description ? '<small class="d-inline-block m-1 mr-2 text-secondary"><i class="fa fa-bars"></i></small>':''}
        ${card.checklists.length ? '<small class="d-inline-block m-1 mr-2 text-secondary"><i class="fa fa-check-square-o"></i></small>':''}
      </div>
      <div class="d-flex flex-wrap justify-content-end flex-grow-1 align-items-center">
        ${memStr}
      </div>
    </div>
    </div>`;
};

const getList = (list) => {
    const cardsStr = list.cards ? list.cards.map(c => getCard(c, list)).join(""):"";
    return `
    <div class="trello-list rounded m-1 px-2 py-1 pb-2 trello-fadein" list-id="${list.id}">
        <div class="d-flex justify-content-between align-items-center mb-1">
            <h6 class="pl-2">${list.title}</h6>
            <button class="btn btn-sm" list-id="${list.id}" onclick="listOption(event)"><i class="fa fa-ellipsis-h"></i></button>
        </div>
        <div class="list-wrapper px-1">
            ${cardsStr}
        </div>
        <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-sm text-left" id="add-new-card">
                <i class="fa fa-plus"></i>&nbsp;&nbsp;Add another card
                </button>
                <button class="btn btn-sm"><i class="fa fa-window-maximize"></i></button>
        </div>
    </div>`;
};

function setLoading(isLoading){
    document.getElementById("centerhold").innerHTML = isLoading ? loader : logo; 
}

window.onload = () => {
    console.log("DOM is ready!");
    addListPopup = document.getElementById("add-list-popup");
    listMenuPopup = document.getElementById("list-menu-popup");
    limitWrapperHeight();
    fetchData();
} 

function limitWrapperHeight() {
    const body = document.documentElement.clientHeight;
    const nav1 = document.getElementById("nav-1").clientHeight;
    const nav2 = document.getElementById("nav-2").clientHeight;
    const wrapper = document.getElementById("wrapper");
    wrapper.style.maxHeight = (body - nav1 - nav2) + "px";
    wrapper.style.minHeight = (body - nav1 - nav2) + "px";
}

function fetchData () {
    setLoading(true);
    fetch(endpoint + "/list")
    .then(res => res.json())
    .then(data => {
        setLoading(false);
        console.log(data);
        lists = data;
        const listStr = lists.map(l => getList(l)).join("")+ addListBtn;
        document.getElementById("wrapper").innerHTML = listStr;
    })
    .catch(err => {
        setLoading(false);
        console.log(err);
    });
}

//Modal Opens when the card is clicked
const getListAndCardIds = (target) => {
    if(target.getAttribute("card-id")) {
      return [target.getAttribute("list-id"), target.getAttribute("card-id")];
    } else {
      return getListAndCardIds(target.parentElement);
    }
}

function openCardModal(e) {
    const [listId, cardId] = getListAndCardIds(e.target);
    
    const list = lists.find(l => l.id == listId);
    const card = list.cards.find(c => c.id == cardId);

    document.getElementById("cardTitle").innerHTML = card.title;
    document.getElementById("inListTitle").innerHTML = list.title;
    document.getElementById("cardDesc").innerHTML = card.description;

    const checklistStr = card.checklists.map(li => getChecklistItem(li)).join("");
    document.getElementById("chkli-wrapper").innerHTML = checklistStr || '<p style="opacity: 0.7">No Checklist</p>';
}


const getChecklistItem = (checklist) => {
    return `
    <div class="d-flex align-items-center">
        <p><i class="fa fa-check-circle ${checklist.checked ? "":"-o"}"></i></p>
        <p class="flex-grow-1 pl-2">${checklist.item}</p>
    </div>
    `;
};

/*Add New List*/
function addNewList(event) {
    event.stopPropagation();
    if(addListPopup) {
        const addNewListBtn = document.getElementById("add-list-btn");
        const rect = addNewListBtn.getBoundingClientRect();
        console.log(rect);

        addListPopup.style.top = rect.top + "px";
        addListPopup.style.left = rect.left + "px";
        addListPopup.style.width = rect.width + "px";
        toggelAddListPopup(true);
    }
}

function  toggelAddListPopup(isOpen) {
    if(addListPopup) {
        addListPopup.style.display = isOpen ? "block":"none";
        if(isOpen){
            document.getElementById("list-title-input").focus();
        }
    }
}

function inputEntered(event){
    if(event.keyCode == 13){
        saveNewList();
    }
}

function saveNewList() {
    const listTitleInput = document.getElementById("list-title-input");
    const listTitle = listTitleInput.value;
    if(listTitle){
        setLoading(true);
        fetch(endpoint + "/list",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
            title: listTitle,
            position: lists.length + 1
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            setLoading(false);
            listTitleInput.value = "";
            toggelAddListPopup(false);
            //UI display and lists update
            const doc = new DOMParser().parseFromString(getList(data),"text/html");
            const newlyAddedList = doc.body.children[0];
            document.getElementById("add-list-btn").before(newlyAddedList);
            lists.push(data);
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
        })
    }
}

function listOption(event) {
    event.stopPropagation();
    if(listMenuPopup.style.display == "block"){
        listMenuPopup.style.display = "none";
    } else {
        let btn = event.target;
        if(btn.nodeName == "i") {
            btn = btn.parentNode;
        }
        clickedListId = btn.getAttribute("list-id");
        const loc = btn.getBoundingClientRect();
        console.log(loc);

        listMenuPopup.style.top = loc.top + loc.height + 5 + "px";
        listMenuPopup.style.left = loc.left + "px";
        listMenuPopup.style.display = "block";
    }
}

function closeOptionMenu() {
    if(listMenuPopup.style.display == "block"){
        listMenuPopup.style.display = "none";
    }
    if(addListPopup.style.display === "block") {
        toggelAddListPopup(false);
    }
}

function wrapperScrolled() {
    closeOptionMenu();
    if(addListPopup.style.display === "block") {
        const rect = document.getElementById("add-list-btn").getBoundingClientRect();
        addListPopup.style.top = rect.top + "px";
        addListPopup.style.left = rect.left + "px";
    }
}

function goDeleteList() {
    if(clickedListId) {
      closeOptionMenu();
      if(confirm("Are you sure to delete this list?")) {
        setLoading(true);
        fetch(`${endpoint}/list/${clickedListId}`, {
          method: "DELETE"
        })
        .then(res => {
          console.log(res);
          setLoading(false);
          const listToRemove = document.querySelector(`.trello-list[list-id="${clickedListId}"]`);
          if(res.ok && listToRemove) {
            listToRemove.remove();
            clickedListId = undefined;
          }
        })
        .catch(err => {
          console.log(err);
          setLoading(false);
          clickedListId = undefined;
        })
      }
    }
}

