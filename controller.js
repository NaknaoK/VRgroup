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
const CenterLatitude = 356791527,CenterLongitude = 1397686666;//中心の緯度,経度

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
  cameraContainer.position.set( -30, 200, 0 );
  cameraContainer.add(camera);
  scene.add(cameraContainer);
  
  //コントローラーのステック操作の閾値
  const threshold = 0.1;
  let VRconnect = false;

  // 光源を作成
  {
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
  const objects1 =await loader.loadAsync("gltf/53394611_bldg_6697_2_op/53394611_bldg_6697_2_op.gltf");//gltf
  // 読み込み後に3D空間に追加
  const model1 = objects1.scene;
  const objects2 = await loader.loadAsync("gltf/533946_dem_6697_op/533946_dem_6697_op.gltf");//gltf
  const model2 = objects2.scene;
  const objects3 = await loader.loadAsync("gltf/53394611_brid_6697_op/53394611_brid_6697_op.gltf");//gltf
  const model3 = objects3.scene;
  const objects4 = await loader.loadAsync("gltf/53394611_tran_6668_op/53394611_tran_6668_op.gltf");//gltf
  const model4 = objects4.scene;
  mapGroup.add(model1);
  mapGroup.add(model2);
  mapGroup.add(model3);
  mapGroup.add(model4);
  scene.add(mapGroup);
  //mapの大きさ0.01倍
  mapGroup.scale.set(1, 1, -1);

  /* ----Map関係---- */
  /* ----CSV関係---- */
  var req = new XMLHttpRequest(); // HTTPでファイルを読み込むためのXMLHttpRrequestオブジェクトを生成
  req.open("get", "honhyo_2021.csv", true); // アクセスするファイルを指定
  req.overrideMimeType("text/plain; charset=Shift_JIS");//文字コードの上書き
  req.send(null); // HTTPリクエストの発行
  
  var accidentGroup = new THREE.Group();
  // レスポンスが返ってきたらconvertCSVtoArray()を呼ぶ	
  req.onload = function(){
	  convertCSVtoArray(req.responseText); // 渡されるのは読み込んだCSVデータ
    console.log(trafficAccident[1][1]);
    //追加 阿部
    for(let i = 1; i < trafficAccident.length; i++){
        if(trafficAccident[i][1] == 30){
          const data1 = trafficAccident[i][54];
          if(354030000 < data1 && data1 < 354060000){//範囲内の緯度かを確認
            const data2 = trafficAccident[i][55];
            //console.log(data2);
            if(1394545000<data2 && data2<1394630000){//範囲内の経度かを確認
              const num1 = CenterLatitude-convertLatitudeAndLongitude(data1);
              const num2 = convertLatitudeAndLongitude(data2)-CenterLongitude;
              let leverage1 = 478/(CenterLatitude-354030000);
              let leverage2 = 575/(1394630000-CenterLongitude);//85.000
              if(num1<0){
                leverage1 = 484/(354060000-CenterLatitude);
              }
              if(num2<0){
                leverage2 = 585/(CenterLongitude-1394545000);
              }
              const posX = num1*leverage1;//緯度を計算
              const posZ = num2*leverage2;//経度を計算
              createAccidentPoint(posX, posZ);
              console.log();
            }
          }
        }
    }
    
    createAccidentPoint(0, 0);
    scene.add(accidentGroup);
    createTrafficVolumeObject(5, 1, 0, 0, 0, 0, 0, trafficAccident[1][4]); //テストとして事故のデータを渡しているが、運用時は交通量に変更
  }
  
  // 読み込んだCSVデータを二次元配列に変換する関数convertCSVtoArray()の定義
  function convertLatitudeAndLongitude(str){ // 読み込んだCSVデータが文字列として渡される
    var deg = Number(str.slice(0,3));
    var min = Number(str.slice(3,5));
    var sec = Number(str.slice(5));
    var result = deg*1000000+min*10000+sec;
    return result;
  }

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
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);
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
        }
    }
  });
  cameraContainer.add(controller1);
  controller2 = renderer.xr.getController( 1 );
  controller2.addEventListener( 'selectstart', onSelectStart );
  controller2.addEventListener( 'selectend', onSelectEnd );
  controller2.addEventListener('squeezestart', onSqueezeStart);
  controller2.addEventListener('squeezeend', onSqueezeEnd);
  controller2.addEventListener( 'connected', ( event )=> {
    if('gamepad' in event.data){
        if('axes' in event.data.gamepad){ //we have a modern controller
          controller2.gamepad = event.data.gamepad;
        }
    }
  });
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
	function handleController1( controller ) {//controller1の処理
		const userData = controller.userData;
    const controllerData = controller.gamepad;
		if ( userData.isSelecting === true ) {//コントローラーボタンが押された際の処理
      
      if(controllerData.buttons[0].pressed == true){
        cameraContainer.position.y += controllerData.buttons[0].value;
      }else if(controllerData.buttons[1].pressed == true){
        cameraContainer.position.y -= controllerData.buttons[1].value;
        xx = 50;
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
		} else {
      let cameraRotation = camera.rotation;
      const bugRotat = (Math.abs(cameraRotation.x)+Math.abs(cameraRotation.z));
      let speed = (Math.abs(controllerData.axes[2])+Math.abs(controllerData.axes[3]))/2;
      if(bugRotat > 3){
        speed *= -1;
        cameraRotation.y *= -1;
      }
      move(cameraRotation , speed);
		}

    
	}

  function handleController2( controller ) {//controller2の処理
    const controllerData = controller.gamepad;
    if(controllerData.buttons[0].pressed == true){
      yy = 50;
    }else if(controllerData.buttons[1].pressed == true){
      yy = 75;
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
//追加 阿部 事故を表すオブジェクトの生成
function createAccidentPoint(posX, posZ) {
  const geometry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshBasicMaterial({color: 0xF4E511});
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(posX, 200, posZ);
  const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,200),new THREE.MeshPhongMaterial({color: 0xF4E511}));
  ray.material.transparent = true;
  ray.position.set(posX, 100, posZ);
  accidentGroup.add(ray);
  accidentGroup.add(cube);
}

//追加 阿部 交通量を表すオブジェクトの生成
function createTrafficVolumeObject(sizeX, sizeZ, posX, posY, posZ, rotX, rotY, trafficVolume){
  const geometry = new THREE.BoxGeometry(sizeX,1,sizeZ);
  let material = new THREE.MeshBasicMaterial({color: 0x0067C0}); //交通量が最低領域の場合の色を設定
  //交通量が多い場合は交通量の値が含まれる領域に応じて色を変更
  if(trafficVolume >= 2){ //領域（仮の値）
    material = new THREE.MeshBasicMaterial({color: 0xED1A3D});
  }else if(trafficVolume >= 1){
    material = new THREE.MeshBasicMaterial({color: 0xF58220});
  }
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(posX, posY, posZ);
  cube.rotation.set(rotX, rotY, 0);
  scene.add(cube);
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
