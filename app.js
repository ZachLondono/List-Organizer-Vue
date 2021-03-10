const board = Vue.component("board", {
    props: {
        boardId: {
            type: String,
            required: true
        }
    },

    created() {
        this.boardId;
        getBoard(this.boardId).then((board) => {
            let newBoard = board.data().board;

            // Check that all required fields exist
            if (!newBoard) newBoard = {}
            if (!newBoard.title) newBoard.title = "";
            if (!newBoard.boxes) newBoard.boxes = [];
            else {
                newBoard.boxes.forEach((box) => {
                    if (!box.cards) box.cards = [];
                });
            }

            this.board = newBoard;

            this.isLoading = false;
            this.isBoardSelected = true;

            this.$nextTick(() => {
                this.$refs.title.value = this.board.title;
                this.updateTitleWidth();
                this.updateWidth();
            });

        }).catch((err) => {
            if (this.$refs.message)
                this.$refs.message.innerText = "Failed to load board";
            console.error(err);
        });

    },

    data: function() {
        return {
            isLoading: true,
            board: {}
        }
    },
    
    methods: {
        addBox: function (newBox) {
            this.board.boxes.push(newBox);
            this.$nextTick(() => this.updateWidth());
        },

        removeBox: function (box) {
            if (!this.board.boxes) return;
            let index = this.board.boxes.indexOf(box);
            if (index > -1) this.board.boxes.splice(index, 1);
        },
        
        saveBoard: function() {
            this.$refs.saveMsg.innerText = "Saving...";
            updateBoard(this.board, this.boardId).then(() => {
                // update last saved timestamp
                this.$refs.saveMsg.innerText= "Saved";
            }).catch(() => {
                // failed to save
            });
        },

        updateTitle: function() {
            this.board.title = this.$refs.title.value;
            this.$refs.title.setSelectionRange(0, 0);
            this.saveBoard();
        },

        updateTitleWidth: function() {
            let titleElem = this.$refs.title;
            let newWidth = ((titleElem.value.length + 1) * 10);
            titleElem.style.width = (newWidth > 600 ? 600 : newWidth) + 'px';
        },

        updateWidth : function () {                                                                                                                                       
            let boxElems = this.$refs.boardCnt.children;

            let totalWidth = 0;
            for (i = 0; i < boxElems.length; i++) {
                let box = boxElems[i];
                totalWidth += box.offsetWidth;
                totalWidth += parseInt(getComputedStyle(box).marginLeft);
                totalWidth += parseInt(getComputedStyle(box).marginRight);
            }
            
            this.$refs.boardCnt.style.width = totalWidth + "px";
        }

    },
    
    template: `
        <p v-if='isLoading' ref="message" >Loading...</p>
        <div v-else>
            <div id="board-header-padding"></div>
            <div id="board-header">
                <input class="editable-title" type="text" value="Title" v-on:keyup="updateTitleWidth" v-on:keyup.enter="updateTitle" v-on:blur="updateTitle" ref="title" >
                <span style="font-size:12px" ref="saveMsg">Saved</span>
            </div>
            <div id="wrapper" ref="boardCnt">
                <!-- TODO: add key to boxes -->
                <box v-for="box in board.boxes" v-bind:boxRef="box" @edit="saveBoard" @remove-box="removeBox"></box>
                <blankbox @add-box="addBox" @edit="saveBoard"></blankbox>
            </div>
        </div>
    `
});

Vue.component("box", {
    props: {
        boxRef: {
            title: {
                type: String,
                required: true
            },
            cards: {
                type: Array,
                required: true
            }
        }
    },
    data: function() {
        return {
            options: [
                "Rename",
                "Delete"
            ]
        }
    },
    methods: {
        addCard: function (newCard) {
            this.boxRef.cards.push(newCard);
            this.$emit('edit');
        },

        removeBox: function() {
            this.$emit('remove-box', this.boxRef);
            this.$emit('edit');
        },

        menuSelect: function(index) {
            if (this.options[index] === "Delete") this.removeBox();
        },

        updateTitle: function() {
            this.boxRef.title = this.$refs.title.value;
            this.$emit('edit');
        },
    },
    template: `
        <div class="box">
            <input class="editable-title" :value="boxRef.title" v-on:keyup.enter="updateTitle" v-on:blur="updateTitle" ref="title">
            <kebabmenu @kebab-selected="menuSelect" v-bind:options="options"></kebabmenu>
            <!-- <button v-on:click="removeBox">Delete</button> -->
            <card v-for="card in boxRef.cards" v-bind="card"></card>
            <blankcard @add-card="addCard"></blankcard>
        </div>
    `
});

Vue.component("card", {
    props: {
        title: {
            type: String,
            required: true
        }
    },
    template: `
        <div class="card">
            <span class="card-title"> {{ title }} </span>
        </div>
    `
})

const blankContainerMixin = {
    data: function () {
        return {
            prompt: false,
            title: ""
        }
    },
    methods: {
        validate: function () {
            
            let newTitle = this.title.replace(/[\r\n\v]+/g, '');
            this.title = "";

            if (!newTitle) return;

            this.prompt = false;
            return newTitle;

        },
        openPrompt: function () {
            this.prompt = true;
            this.$nextTick(() => this.$refs.input.focus());
        },
        cancelPrompt: function () {
            this.prompt = false;
        }
    }
}
Vue.component("blankbox", {
    mixins: [blankContainerMixin],
    methods: {
        newBox: function() {
            
            let newTitle = this.validate();
            let box = {
                title: newTitle,
                cards: []
            };

            this.$emit('add-box', box);
            this.$emit('edit');
        }
    },
    template: `
        <div class="box" id="empty-box" >
            <div v-on:click="openPrompt" v-show="!prompt" >
                <span class="box-title">+ Add New Box</span>
            </div>
            <div v-show="prompt">
                <textarea id="box-prompt" v-model.string="title" v-on:keyup.enter="newBox" ref="input" ></textarea>
                <button v-on:click="newBox">Create</button>
                <button v-on:click="cancelPrompt">X</button>
            </div>
        </div>
    `
});

Vue.component("blankcard", {
    mixins: [blankContainerMixin],
    methods: {
        newCard: function () {
            
            let newTitle = this.validate();

            let card = {
                title: newTitle,
            };

            this.$emit('add-card', card);
        }
    },
    template: `
        <div class="card" id="empty-card">
            <div v-on:click="openPrompt" v-show="!prompt" >
                <span class="card-title">+ Add New Card</span>
            </div>
            <div v-show="prompt">
                <textarea id="box-prompt" v-model.string="title" v-on:keyup.enter="newCard" ref="input" ></textarea>
                <button v-on:click="newCard">Create</button>
                <button v-on:click="cancelPrompt">X</button>
            </div>
        </div>
    `
});

const boardselector = Vue.component("boardselector", {
    created() {
        boardList().then((boardRefs) => {
            this.boardRefs = boardRefs;
            this.isLoading = false;
        })
    },
    
    data: function () {
        return {
            isLoading: true,
            boardRefs: []
        };
    },

    methods : {
        selectBoard: function(boardId) {
            router.push("/board/" + boardId);
        },

        createBoard: function() {
            
            let newBoard = {
                title: "New Board",
                boxes: []
            }

            createBoard(newBoard).then((docRef) => {
                this.selectBoard(docRef.id);
            }).catch((err) => {
                // failed to create new board
            });
        
        }

    },
    
    template: `
        <p v-if='isLoading' ref="message" >Loading...</p>
        <div v-else id="board-selector" >
            <div class="board" id="emptyboard" v-on:click="createBoard()">
                <span class="title">+ New Board</span>
            </div>
            <div v-for="boardRef in boardRefs">
                <div class="board" v-on:click="selectBoard(boardRef.id)">
                    <span class="title">{{ boardRef.data().board.title }}</span>
                </div>
            </div>
        </div>
    `
});

const appHeader = Vue.component("appHeader", { 
    template: `
        <div v-else id="header" >
        </div>
    `
});

const pageheader = Vue.component("pageheader", {
    methods: {
        goHome: function () {
            router.push("/");
        }
    },
    template: `
        <div>
            <div id="header-padding"></div>
            <div id="header" ref="header">
                <div class="button" style="margin-top: auto" v-on:click="goHome">
                    <span style="margin: 10px">Home</span>
                </div>
            </div>
        </div>
    `
});

Vue.component("kebabmenu", {
    
    created() {
        document.addEventListener.call(window, "click", event => {
            if (event.target != this.$refs.menu && this.isOpen) {
                this.toggleMenu();
            }
        });
    },
    
    props: {
        options: {
            type: Array,
            required: true
        }
    },
    
    data: function() {
        return {
            isOpen: false
        }
    },

    methods: {
        
        toggleMenu: function() {
            let contents = this.$refs.contents;
            contents.forEach((content) => content.style.display = this.isOpen ? "none" : "block");
            this.isOpen = !this.isOpen;
        },

        optionSlected: function(option) {
            let index = this.options.indexOf(option);
            if (index > -1) this.$emit("kebab-selected", index);
        }

    },

    template: `
        <div class="kebab" v-on:click="toggleMenu" ref="menu">
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="circle"></div>
            <div class="dopdown-options">
                <span v-for="option in options" ref="contents" v-on:click="optionSlected(option)" class="dopdown-option"><span class="dropdown-option-text">{{ option }}</span></span>
            </div>
        </div>
    `
})

const NotFoundComponent = {
    template: `
        <h1>404 Not Found</h1>
    `
};

const router = new VueRouter({
    history: true,
    routes: [
        {   
            path: '/', 
            component: boardselector
        },
        { 
            path: '/board/:boardId',
            component: board, 
            props: true
        },
        { path: '*', component: NotFoundComponent }
    ]
});

var app = new Vue({
    el: '#app',
    router
});