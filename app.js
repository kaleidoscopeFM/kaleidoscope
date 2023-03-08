var redirect_uri = "http://127.0.0.1:5500/index.html" // change this your value
//var redirect_uri = "http://127.0.0.1:5500/index.html";
 

var client_id = ""; 
var client_secret = ""; // In a real app you should not expose your client_secret to the user

var access_token = null;
var refresh_token = null;

var userHistory=[];

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYER = "https://api.spotify.com/v1/me/player";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const openModalButtons = document.querySelectorAll('[data-modal-target]');
const closeModalButtons = document.querySelectorAll('[data-close-button]');
const overlay = document.getElementById('overlay')
function LinkedList() {
    var length = 0;
    var head = null;

    var Node = function(element){
        this.element = element;
        this.next = null;
    }

    this.size = function(){
        return length;
    }

    this.head = function(){
        return head;
    }

    this.add = function(element){
        var node = new Node(element);
        if(head === null){
            head = node;
        } else {
            currentNode = head;

            while(currentNode.next){
                currentNode = currentNode.next
            }

            currentNode.next = node;
        }

        length++;
    }

    this.remove = function(element){
        var currentNode = head;
        if(currentNode.element === element){
            head = currentNode.next;
        } else {
            while(currentNode.element !== element){
                previousNode = currentNode.next;
                currentNode = currentNode.next;
            }

            previousNode.next = currentNode.next;
        }
        
        length --;
    }

    this.isEmpty = function(){
        return length === 0;
    }

    this.indexOf = function(element){
        var currentNode = head;
        var index = -1;

        while(currentNode){
            index++;
            if(currentNode.element === element){
                return index;
            }
            currentNode = currentNode.next;
        }

        return -1;
    }

    this.elementAt = function(index){
        var currentNode = head;
        var count = 0;
        while (count < index){
            count ++;
            currentNode = currentNode.next
        }
        return currentNode.element;
    }

    this.addAt = function(index, element){
        var node = new Node(element);

        var currentNode = head;
        var previousNode;
        var currentIndex = 0;

        if(index > length){
            return false;
        }

        if(index === 0){
            node.next = currentNode;
            head = node;
        } else {
            while(currentIndex < index){
                currentIndex++;
                previousNode - currentNode;
                currentNode = currentNode.next;
            }
            node.next = currentNode;
            previousNode.next = node;
        }
        length++;
    }

    this.removeAt = function(index, element){
        var currentNode = head;
        var previousNode;
        var currentIndex = 0;

        if(index < 0 || index >= length){
            return null;
        }

        if(index === 0){
            head = currentNode.next;
        } else {
            while(currentIndex < index){
                currentIndex++;
                previousNode - currentNode;
                currentNode = currentNode.next;
            };
            previousNode.next = currentNode.next;
        }
        length--;
        return currentNode.element
    }
}

var albumConga = new LinkedList(); 


function onPageLoad(){
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");
    userHistory = JSON.parse(localStorage.getItem("userHistory") || "[]");
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            // we don't have an access token so present token section
            document.getElementById("tokenSection").style.display = 'block';  
            createTable(userHistory);
        }
        else {
            // we have an access token so present device section
            document.getElementById("deviceSection").style.display = 'block';  
            currentlyPlaying();
        }
    }
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}


function handleApiResponse(){
    if ( this.status == 200){
        console.log(this.responseText);
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 204 ){
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }    
}


function currentlyPlaying(){
    callApi( "GET", PLAYER + "?market=US", null, handleCurrentlyPlayingResponse );
    createTable(userHistory);
}

class albumInfo {
    constructor(image, title, artist) {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        this.albumImage = image;
        this.albumTitle = title;
        this.trackArtist = artist;
        this.lastListen = today.toDateString();
        this.review = "";

        this.updatelastListen = function (date) {
            this.lastListen = date;
        }
        this.updateReview = function () {
            this.review = "Test";
        }
    }
}

function addNewRow(image, title, artist) {
    var table = document.getElementById("albumTable");
    var rowCount = table.rows.length;
    
    table.innerHTML += '' +
                        '<tr bgcolor = "lightgrey">' +
                        '<th>' + "<img id=\"albumImage\" src=\""+image+"\">" + '</th>' +
                        '<th>' + title + '</th>'+
                        '<th>' + artist + '</th>'+
                        '<th>' + '' + '</th>'+
                        '<th>' + '' + '</th>'+
                        '</tr>'
}

function createTable(albumInfo) {
    var table = document.getElementById("albumTable");
    var rowCount = table.rows.length;
    if (rowCount > 1){
        let i = 0;
        while (i < rowCount-1) {
            i++;
            table.deleteRow(1);     
        }
    }

    for(let i = 0; albumInfo.length; i++){
        index = albumInfo.length - i -1;
        table.innerHTML += '' +
                            '<tr bgcolor = "lightgrey">' +
                            '<th>' + "<img id=\"albumImage\" src=\""+albumInfo[index].albumImage+"\">" + '</th>' +
                            '<th>' + albumInfo[index].albumTitle + '</th>'+
                            '<th>' + albumInfo[index].trackArtist + '</th>'+
                            '<th>' + albumInfo[index].lastListen + '</th>'+
                            '<th>' + '<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#myModal">Review</button>' + 
                            '</th>'+
                            '<th>' + '' + '</th>'+
                            '</tr>'
    }
}

function checkDups(currentAlbum, userHistory){
    for(let i = 0; i < userHistory.length; i++){
        if(currentAlbum.albumTitle == userHistory[i].albumTitle & currentAlbum.trackArtist == userHistory[i].trackArtist){
            if(currentAlbum.albumTitle == userHistory[i].albumTitle & currentAlbum.trackArtist == userHistory[i].trackArtist){
                if(currentAlbum.lastListen == userHistory[i].lastListen){
                    userHistory.splice(i, 1);
                }
                else{
                return false;
                }
            }
        }
    } 

    userHistory.push(currentAlbum);
    albumConga.add(currentAlbum);
    localStorage.setItem("userHistory",JSON.stringify(userHistory));
    
    }

function handleCurrentlyPlayingResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if ( data.item != null ){
            currentAlbum = new albumInfo(data.item.album.images[0].url, data.item.album.name, data.item.artists[0].name);
            document.getElementById("albumImage").src = currentAlbum.albumImage;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("albumTitle").innerHTML = currentAlbum.albumTitle;
            document.getElementById("trackArtist").innerHTML = currentAlbum.trackArtist;
            checkDups(currentAlbum,userHistory);
            
        }
    }
    else if ( this.status == 204 ){

    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}


