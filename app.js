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

            this.$nextTick(() => this.$refs.title.value = this.board.title);

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
        },
        
        saveBoard: function() {
            updateBoard(this.board, this.boardId).then(() => {
                // update last saved timestamp
            }).catch(() => {
                // failed to save
            });
        },

        updateTitle: function() {
            this.board.title = this.$refs.title.value;
        }
    },
    
    template: `
        <p v-if='isLoading' ref="message" >Loading...</p>
        <div v-else>
            <div id="board-header">
                <input type="text" value="Title" v-on:keyup="updateTitle" ref="title">
                <button v-on:click="saveBoard">Save</button>
            </div>
            <div id="wrapper">
                <div id="board">
                    <div v-for="box in board.boxes">
                        <box v-bind="box"></box>
                    </div>
                    <blankbox @add-box="addBox"></blankbox>
                </div>
            </div>
        </div>
    `
});

Vue.component("box", {
    props: {
        title: {
            type: String,
            required: true
        },
        cards: {
            type: Array,
            required: true
        }
    },
    data: function() {
        return {}
    },
    methods: {
        addCard: function (newCard) {
            this.cards.push(newCard);
        }
    },
    template: `
        <div class="box">
            <span class="box-title"> {{ title }} </span>
            <div v-for="card in cards">
                <card v-bind="card"></card>
            </div>
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
            <div v-for="boardRef in boardRefs">
                <div class="board" v-on:click="selectBoard(boardRef.id)">
                    <span class="title">{{ boardRef.data().board.title }}</span>
                </div>
            </div>
            <div class="board" id="emptyboard" v-on:click="createBoard()">
                <span class="title">+ New Board</span>
            </div>
        </div>
    `
});

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