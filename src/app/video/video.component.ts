import { Component, OnInit } from '@angular/core';
// import Peer = require('simple-peer');
// import { Socket } from 'ngx-socket-io';
import * as io from 'socket.io-client';


@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {
  name = 'Angular';
  // peer: any;
  // socket = io();
  remoteStream;
  myVar= true;
  tcode : string;
  roomNumber:string;
  socket = io("http://localhost:4000");
  streamConstraints = { audio: true, video: true };
  localStream: any;
  rtcPeerConnection;
  iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}

  // constructor(private socketngx: Socket) { }  
  isCaller;
  constructor(){}

  ngOnInit() {
  }


  submit(eventname) {

    if (this.tcode === '') {
      alert("Please type a room number")
  } else {
    console.log("the code :" + this.tcode, eventname);
      this.roomNumber = this.tcode;
      this.socket.emit('create or join', this.roomNumber);
      var divSelectRoom = document.getElementById("selectRoom");
      // var divConsultingRoom = document.getElementById("consultingRoom");
      divSelectRoom.style.display = "none;";
      // divConsultingRoom.style.display = "block;";
  }


  this.socket.on('created',  (room)=> {
    console.log(">>>created");
    navigator.mediaDevices.getUserMedia( { audio: true, video: true }).then( (stream)=> {
  this.myVar= false;
        this.localStream = stream;
        var localVideo = document.getElementById("localVideo");
        localVideo['srcObject'] = stream;
        this.isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
  });

    this.socket.on('joined',  (room)=> {
      console.log(">>>JOINED");
      navigator.mediaDevices.getUserMedia(this.streamConstraints).then( (stream)=> {
       this.myVar= false;
          this.localStream = stream;
          var localVideo = document.getElementById("localVideo");
          localVideo['srcObject'] = stream;
          console.log(">>>localvideo", localVideo)
          this.socket.emit('ready', this.tcode);
      }).catch(function (err) {
          console.log('An error ocurred when accessing media devices', err);
      });
  });

  this.socket.on('ready',  () =>{
    console.log("READY>>>>>>")
    if (this.isCaller) {
        this.rtcPeerConnection = new RTCPeerConnection(this.iceServers);
        this.rtcPeerConnection.onicecandidate = onIceCandidate;
        this.rtcPeerConnection.ontrack = onAddStream;
        this.rtcPeerConnection.addTrack(this.localStream.getTracks()[0], this.localStream);
        this.rtcPeerConnection.addTrack(this.localStream.getTracks()[1], this.localStream);
        this.rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                this.rtcPeerConnection.setLocalDescription(sessionDescription);
                this.socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: this.tcode
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});


this.socket.on('offer', (event) =>{
  console.log("......OFFER")
  if (!this.isCaller) {
      this.rtcPeerConnection = new RTCPeerConnection(this.iceServers);
      this.rtcPeerConnection.onicecandidate = onIceCandidate;
      this.rtcPeerConnection.ontrack = onAddStream;
      this.rtcPeerConnection.addTrack(this.localStream.getTracks()[0], this.localStream);
      this.rtcPeerConnection.addTrack(this.localStream.getTracks()[1], this.localStream);
      this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
      this.rtcPeerConnection.createAnswer()
          .then(sessionDescription => {
              this.rtcPeerConnection.setLocalDescription(sessionDescription);
              this.socket.emit('answer', {
                  type: 'answer',
                  sdp: sessionDescription,
                  room: this.tcode
              });
          })
          .catch(error => {
              console.log(error)
          })
  }
});

this.socket.on('answer',  (event)=> {
  this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

let onIceCandidate = (event: any): any => {
  if (event.candidate) {
      console.log('sending ice candidate');
      this.socket.emit('candidate', {
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
          room: this.tcode
      })
  }
}

let onAddStream = (event:any):any=> {
  console.log(">>>>here in onaddStream")
  var remoteVideo = document.getElementById("remoteVideo");
  remoteVideo['srcObject'] = event.streams[0];
  console.log(">>>>here in onaddStream", remoteVideo)
  this.remoteStream = event.stream;
}

    // console.log("the code :" + this.tcode, eventname);
}

}
