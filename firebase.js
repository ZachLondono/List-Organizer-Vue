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
const boardCollection = db.collection("Board");

const  createBoard =  function (newBoard) {
    return boardCollection.add(newBoard);
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

const boardList = async function () {
    const boards = [];
    await boardCollection.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            boards.push(doc);
        });
    });
    return boards;
}