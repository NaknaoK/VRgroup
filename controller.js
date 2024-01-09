window.addEventListener("DOMContentLoaded", init);

import * as THREE from 'three';
// WebVRの判定、遷移ボタンのスクリプト
import { VRButton } from "three/addons/webxr/VRButton.js";
// WebXRのポリフィルを読み込み
import WebXRPolyfill from "webxr-polyfill";
import { XRControllerModelFactory } from 'https://unpkg.com/three@0.150.1/examples/jsm/webxr/XRControllerModelFactory.js';
//PC上で滑らかにカメラコントローラーを制御する為に使用↓
import { OrbitControls } from 'https://unpkg.com/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
let controller1, controller2;
let controllerGrip1, controllerGrip2;
const CenterLatitude = 354045000,CenterLongitude = 1394587500;//中心の緯度,経度

/* ----Map関係---- */

/* ----Map関係---- */ 

async function init() {
  /* ----基本的な設定----- */
  // WebXRのポリフィルを有効にする
  const polyfill = new WebXRPolyfill();

  // サイズを指定
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // シーンの作成
  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xe0e0e0 );
  
  // レンダラーの作成
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(width, height);
  
  // console.log(renderer);
  // console.log("kakakakkakakaka");
  renderer.xr.enabled = true;// レンダラーのXRを有効化
  document.body.appendChild(renderer.domElement);
  // WebVRの開始ボタンをDOMに追加
  document.body.appendChild(VRButton.createButton(renderer));

  // カメラを作成
  const camera = new THREE.PerspectiveCamera(90, width / height);

  //CSVデータを格納するやつら
  let trafficAccident = [];
  
  // カメラ用コンテナを作成(3Dのカメラを箱に入れて箱自体を動かす) 
  const cameraContainer = new THREE.Object3D();
  cameraContainer.add(camera);
  // cameraContainer.add(controller1);
  // cameraContainer.add(controller2);
  scene.add(cameraContainer);
  
  //コントローラーのステック操作の閾値
  const threshold = 0.1;
  let VRconnect = false;

  // 光源を作成
  {
    // const spotLight = new THREE.SpotLight(
    //   0xffffff,
    //   4,
    //   2000,
    //   Math.PI / 5,
    //   0.2,
    //   1.5
    // );
    // spotLight.position.set(10, 10, 10);
    // scene.add(spotLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    //光源を作成
		const light = new THREE.DirectionalLight( 0xffffff, 2.5);
		light.position.set( 200, 400, 200 );
		scene.add( light );
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set( -400, 400, -100 );
    scene.add(pointLight);
  }
  /* ----基本的な設定----- */
  /* ----Map関係---- */
  //モデルデータをまとめるグループ
  var mapGroup = new THREE.Group();
  // GLTF形式のモデルデータを読み込む
  const loader = new GLTFLoader();
  // GLTFファイルのパスを指定
  const objects1 = await loader.loadAsync("gltf/53394611_bldg_6697_2_op/53394611_bldg_6697_2_op.gltf");
  // 読み込み後に3D空間に追加
  const model1 = objects1.scene;
  const objects2 = await loader.loadAsync("gltf/533946_dem_6697_op/533946_dem_6697_op.gltf");
  const model2 = objects2.scene;
  const objects3 = await loader.loadAsync("gltf/53394611_brid_6697_op/53394611_brid_6697_op.gltf");
  const model3 = objects3.scene;
  const objects4 = await loader.loadAsync("gltf/53394611_tran_6668_op/53394611_tran_6668_op.gltf");
  const model4 = objects4.scene;
  mapGroup.add(model1);
  mapGroup.add(model2);
  mapGroup.add(model3);
  mapGroup.add(model4);
  scene.add(mapGroup);
  //mapの大きさ0.01倍
  mapGroup.scale.set(1, 1, 1);
  /* ----Map関係---- */
  /* ----CSV関係---- */
  var req = new XMLHttpRequest(); // HTTPでファイルを読み込むためのXMLHttpRrequestオブジェクトを生成
  req.open("get", "honhyo_2022.csv", true); // アクセスするファイルを指定
  req.overrideMimeType("text/plain; charset=Shift_JIS");//文字コードの上書き
  req.send(null); // HTTPリクエストの発行
  
  // レスポンスが返ってきたらconvertCSVtoArray()を呼ぶ	
  req.onload = function(){
	  convertCSVtoArray(req.responseText); // 渡されるのは読み込んだCSVデータ
    console.log(trafficAccident[1][1]);
    //追加 阿部
    for(let i = 1; i < trafficAccident.length; i++){
        if(trafficAccident[i][1] == 30){
          const data1 = trafficAccident[i][60];
          //console.log(data1);
          if(354030000 < data1 || data1 < 354060000){//中心の緯度
            const data2 = trafficAccident[i][61];
            //console.log(data2);
            if(1394545000<data2 || data2<1394630000){//中心の経度
              createAccidentPoint(data1, data2);
              console.log(3);
            }
          }
        }
    }
    createTrafficVolumeObject(5, 1, 0, 0, 0, 0, 0, trafficAccident[1][4]); //テストとして事故のデータを渡しているが、運用時は交通量に変更
  }
  
  // 読み込んだCSVデータを二次元配列に変換する関数convertCSVtoArray()の定義
  function convertCSVtoArray(str){ // 読み込んだCSVデータが文字列として渡される
    let tmp = str.split("\n"); // 改行を区切り文字として行を要素とした配列を生成
    //各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
    for(var i=0;i<tmp.length;++i){
      trafficAccident[i] = tmp[i].split(',');
    }
  }
  /* ----CSV関係---- */

  

  /* ----コントローラー設定----- */
  
  // コントローラーイベントの設定
  function onSelectStart() {
    this.userData.isSelecting = true;
    //console.log(controller1);
    //console.log(camera.rotation);
    // console.log(this._listeners['buttondown'].indexOf( onButtonDown ));
  }
  function onSelectEnd() {
    this.userData.isSelecting = false;
  }
  function onSqueezeStart(){
    this.userData.isSelecting = true;
  }
  function onSqueezeEnd(){
    this.userData.isSelecting = false;
  }

  //コントローラー取得
  controller1 = renderer.xr.getController( 0 );
  controller1.addEventListener( 'selectstart', onSelectStart);
  controller1.addEventListener( 'selectend', onSelectEnd );
  // controller1.addEventListener('triggerdown', onTriggerDown);
  // controller1.addEventListener('triggerup', onTriggerUp);
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);
  //controller1.addEventListener('buttondown', (e) =>{e});
  // controller1.addEventListener('buttondown', (event) => {
  //   const buttonId = event.data.button; // ボタンのIDを取得
  //   switch (buttonId) {
  //     case 0: // Aボタン
  //       console.log('A button pressed!');
  //       // Aボタンが押されたときの処理を追加
  //       cameraContainer.position.x += 0.01;
  //       this.userData.isSelecting = true;
  //       break;
  //     default:
  //       break;
  //   }
  // });
  // controller1.addEventListener("connected", (e) => {
  //   console.log(e.data.gamepad)
  // })
  controller1.addEventListener('gamepadconnected', (event) => {
    const gamepad = event.gamepad;
    // サムスティックの変更があったときの処理
    controller1.userData.isSelecting = true;
    cameraContainer.position.x -= 0.1;
    // ここでサムスティックの値に基づいた処理を実装
  });
  controller1.addEventListener( 'connected', ( event )=> {
    if('gamepad' in event.data){
        if('axes' in event.data.gamepad){ //we have a modern controller
          controller1.gamepad = event.data.gamepad;
          VRconnect = true;
          //console.log(controller1);
          //console.log(controller1.gamepad);
        }
    }
  });
  cameraContainer.add(controller1);
  //scene.add( controller1 );
  controller2 = renderer.xr.getController( 1 );
  controller2.addEventListener( 'selectstart', onSelectStart );
  controller2.addEventListener( 'selectend', onSelectEnd );
  controller2.addEventListener('squeezestart', onSqueezeStart);
  controller2.addEventListener('squeezeend', onSqueezeEnd);
  // controller2.addEventListener('inputsourceschange', (event) => {
  //   const buttonId = event.data.button; // ボタンのIDを取得
  //   switch (buttonId) {
  //     case 0: // Aボタン
  //       console.log('A button pressed!');
  //       // Aボタンが押されたときの処理を追加
  //       cameraContainer.position.x += 0.01;
  //       this.userData.isSelecting = true;
  //       break;
  //     default:
  //       cameraContainer.position.x -= 0.01;
  //       break;
  //   }
  // });
  controller2.addEventListener( 'connected', ( event )=> {
    if('gamepad' in event.data){
        if('axes' in event.data.gamepad){ //we have a modern controller
          controller2.gamepad = event.data.gamepad;
          //console.log(camera.rotation);
        }
    }
  });
  // scene.add( controller2 );
  cameraContainer.add(controller2);
  //コントローラーモデルを取得
  const controllerModelFactory = new XRControllerModelFactory();
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  cameraContainer.add( controllerGrip1 );
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  cameraContainer.add( controllerGrip2 );
  //コントローラーから出る光線の作成
  const geo = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 )]);
  const mat = new THREE.LineBasicMaterial({color: 0xff0000});
  const line = new THREE.Line( geo , mat );
  line.name = 'line';
  line.scale.z = 1;//光線の長さ
  controller1.add( line.clone() );
  controller2.add( line.clone() );
  

  let xx = 0,yy = 100;
  //機能
	function handleController1( controller ) {
		const userData = controller.userData;
    const controllerData = controller.gamepad;
    //controller1 = controller;
		if ( userData.isSelecting === true ) {//コントローラーボタンが押された際の処理
      
      //console.log(Math.abs(-90.0));
      
      if(controllerData.buttons[0].pressed == true){
        cameraContainer.position.y += controllerData.buttons[0].value;
      }else if(controllerData.buttons[1].pressed == true){
        cameraContainer.position.y -= controllerData.buttons[1].value;
        xx = 50;
        //xx = controller1.gamepad.axes[1] * 100;
        // yy = controller2.gamepad.axes[1] * 100;
        //console.log(2);
      //}
      }else if(controllerData.buttons[2].pressed == true){
        xx = 150;
      }else if(controllerData.buttons[3].pressed == true){
        xx = 250;
      }else if(controllerData.buttons[4].pressed == true){
        xx = 350;
      }else if(controllerData.buttons[5].pressed == true){
        xx = 450;
      }else if(controllerData.buttons[6].pressed == true){
        xx = 550;
      }
      
      
      //cameraContainer.position.x += 0.1;
      // cube.position.set(
      //   Math.random() * -1000 - 300,  // x座標を-5から5の範囲でランダムに設定
      //   0,  // y座標
      //   Math.random() * -1000 - 300   // z座標を-5から5の範囲でランダムに設定
      // );
      // scene.add(cube);
		} else {
      // if(controller1.gamepad.axes[2] > 0 || controller1.gamepad.axes[2] < 0){
      //   cameraContainer.position.x += controllerData.axes[2];
      // }
      // if(controller1.gamepad.axes[3] >= threshold || controller1.gamepad.axes[3] <= 0-threshold){
      //   cameraContainer.position.z += controllerData.axes[3];
      // }
      //const speed = Math.abs(controllerData.axes[2])+Math.abs(controllerData.axes[3]);
      // if(camera.rotation.y < 0){

      // }else{//前面を見てる

      // }
      let cameraRotation = camera.rotation;
      const bugRotat = (Math.abs(cameraRotation.x)+Math.abs(cameraRotation.z));
      let speed = (Math.abs(controllerData.axes[2])+Math.abs(controllerData.axes[3]))/2;
      // if(speed > 1){
      //   speed = 1;
      // }
      if(bugRotat > 3){
        speed *= -1;
        cameraRotation.y *= -1;
      }
      move(cameraRotation , speed);
      //cameraContainer.position.x += Math.cos(Math.PI*(camera.rotation.y/1.5))*controllerData.axes[2];
      //cameraContainer.position.z += Math.sin(Math.PI*(camera.rotation.y/1.5))*controllerData.axes[3];
		}

    
	}

  function handleController2( controller ) {
    const controllerData = controller.gamepad;
    if(controllerData.buttons[0].pressed == true){
      yy = 50;
      // xx = controller1.gamepad.axes[2] * 100;
      // yy = controller2.gamepad.axes[2] * 100;
      //console.log(3);
    }else if(controllerData.buttons[1].pressed == true){
      yy = 75;
      // xx = controller1.gamepad.axes[3] * 100;
      // yy = controller2.gamepad.axes[3] * 100;
      //console.log(4);
    //}
    }else if(controllerData.buttons[2].pressed == true){
      yy = 125;
    }else if(controllerData.buttons[3].pressed == true){
      yy = 150;
    }else if(controllerData.buttons[4].pressed == true){
      yy = 175;
    }else if(controllerData.buttons[5].pressed == true){
      yy = 200;
    }else if(controllerData.buttons[6].pressed == true){
      yy = 225;
    }
  }
  // 移動関数
    function move(orientation , speed) {
      const direction = new THREE.Vector3(controller1.gamepad.axes[2], 0, controller1.gamepad.axes[3]);
      direction.applyQuaternion(new THREE.Quaternion(0, orientation.y, 0));
      cameraContainer.position.addScaledVector(direction, speed);
    }
  /* ----コントローラー設定----- */
  

  // 立方体を生成する関数
  function createCube() {
    const geometry = new THREE.BoxGeometry(100,100,100);
    const material = new THREE.MeshBasicMaterial({ color: getRandomColor() });//のっぺりとした影が出来ない
    //const material = new THREE.MeshPhongMaterial({ color: getRandomColor() });//光沢感が出る
    //const material = new THREE.MeshStandardMaterial({ color: getRandomColor() });//現実の物理現象を再現する
    const cube = new THREE.Mesh(geometry, material);
    return cube;
  }
    // ランダムな色を生成する関数
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
//追加 阿部 事故を表すオブジェクトの生成
function createAccidentPoint(posX, posZ) {
  const geometry = new THREE.BoxGeometry(5,5,5);
  const material = new THREE.MeshBasicMaterial({color: 0xF4E511});
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(posX, 200, posZ);
  const ray = new THREE.Mesh(new THREE.CylinderGeometry(1,1,200,5),new THREE.MeshPhongMaterial({color: 0xF4E511}));
  ray.material.transparent = true;
  ray.material.opacity = 0.5
  ray.position.set(posX, -100, posZ);
  cube.add(ray);
  scene.add(cube);
  console.log(cube.position.x + ", " + cube.position.z);
  console.log(cube);
}

//追加 阿部 交通量を表すオブジェクトの生成
function createTrafficVolumeObject(sizeX, sizeZ, posX, posY, posZ, rotX, rotY, trafficVolume){
  const geometry = new THREE.BoxGeometry(sizeX,1,sizeZ);
  let material = new THREE.MeshBasicMaterial({color: 0x0067C0}); //交通量が最低領域の場合の色を設定
  //交通量が多い場合は交通量の値が含まれる領域に応じて色を変更
  if(trafficVolume >= 2){ //領域（仮の値）
    material = new THREE.MeshBasicMaterial({color: 0xED1A3D});
    //console.log("0xED1A3D");
  }else if(trafficVolume >= 1){
    material = new THREE.MeshBasicMaterial({color: 0xF58220});
  }
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(posX+200, posY, posZ);
  cube.rotation.set(rotX, rotY, 0);
  scene.add(cube);
  console.log(cube.position.x + ", " + cube.position.z)
}



  // レンダラーにループ関数を登録
  renderer.setAnimationLoop(tick);
  
  // 毎フレーム時に実行されるループイベント
  function tick() {
    
    



    // レンダリング
    if(VRconnect){
      handleController1( controller1 );
      handleController2( controller2 );
    }
    renderer.render(scene, camera);
  }

  // リサイズ処理
  window.addEventListener("resize", onResize);
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
