var firebaseConfig = {
    apiKey: "AIzaSyCjrwNK5VBmeeXu10EDD8rPCoDb7-cwuBM",
    authDomain: "listorganizer-39fe6.firebaseapp.com",
    projectId: "listorganizer-39fe6",
    storageBucket: "listorganizer-39fe6.appspot.com",
    messagingSenderId: "378213540520",
    appId: "1:378213540520:web:deeb29eba49307c4c8189d",
    measurementId: "G-4QPXCBXYMC"
};

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();  
var auth = firebase.auth();		

const boardCollection = db.collection("Board");

const  createBoard =  function (board) {
    return boardCollection.add({board});
}
    
const updateBoard = function (board, id) {
    return boardCollection.doc(id).update({board});
}

const deleteBoard = function (boardId) {
    return boardCollection.doc(boardId).delete();
}

const getBoard = async function (boardId) {
    var board = {};
    await boardCollection.doc(boardId).get().then((doc) =>{
        if (doc.exists) board = doc;
        else throw 'Board does not exist';
    });
    
    return board;
}

const boardList = async function (uid) {
    const boards = [];
    await boardCollection.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            if (doc.data().board.uid == uid) boards.push(doc);
        });
    });
    return boards;
}

const signInFB = async function (email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

const createAccountFB = async function(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
}