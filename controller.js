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
var controller1, controller2;
let controllerGrip1, controllerGrip2;

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
  
  console.log(renderer);
  console.log("kakakakkakakaka");
  renderer.xr.enabled = true;// レンダラーのXRを有効化
  document.body.appendChild(renderer.domElement);
  // WebVRの開始ボタンをDOMに追加
  document.body.appendChild(VRButton.createButton(renderer));

  // カメラを作成
  const camera = new THREE.PerspectiveCamera(90, width / height);

  //CSVデータを格納するやつら
  let data = [];
  //let data = [1][4];
  
  // カメラ用コンテナを作成(3Dのカメラを箱に入れて箱自体を動かす) 
  const cameraContainer = new THREE.Object3D();
  cameraContainer.add(camera);
  scene.add(cameraContainer);
  
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);
    //光源を作成
		const light = new THREE.DirectionalLight( 0xffffff, 2 );
		light.position.set( 2, 4, 2 );
		scene.add( light );
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
  mapGroup.scale.set(0.01, 0.01, 0.01);
  /* ----Map関係---- */
  /* ----CSV関係---- */
  var req = new XMLHttpRequest(); // HTTPでファイルを読み込むためのXMLHttpRrequestオブジェクトを生成
  req.open("get", "syuukei04.csv", true); // アクセスするファイルを指定
  req.overrideMimeType("text/plain; charset=Shift_JIS");//文字コードの上書き
  req.send(null); // HTTPリクエストの発行
  
  // レスポンスが返ってきたらconvertCSVtoArray()を呼ぶ	
  let d = 0;
  req.onload = function(){
	  convertCSVtoArray(req.responseText); // 渡されるのは読み込んだCSVデータ
    d = data[1][4];
    
  }
  // 立方体の作成
  const cube = createCube();
  console.log(d);
  cube.position.set( 0, 100, -500);
  const cube2 = cube;
  scene.add(cube2);
  // 読み込んだCSVデータを二次元配列に変換する関数convertCSVtoArray()の定義
  function convertCSVtoArray(str){ // 読み込んだCSVデータが文字列として渡される
    //let result = []; // 最終的な二次元配列を入れるための配列
    let tmp = str.split("\n"); // 改行を区切り文字として行を要素とした配列を生成
    // 各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
    for(var i=0;i<tmp.length;++i){
      data[i] = tmp[i].split(',');
    }
    console.log(data[1][4]);
    //return result; //result[1][4]の値を返す
  }
  /* ----CSV関係---- */

  

  /* ----コントローラー設定----- */
  
  // コントローラーイベントの設定
  function onSelectStart() {
    this.userData.isSelecting = true;
  }
  function onSelectEnd() {
    this.userData.isSelecting = true;
  }	

  //コントローラー取得
  controller1 = renderer.xr.getController( 0 );
  //controller1.addEventListener( 'selectstart', ( event )=> {onSelectStart(event) });
  controller1.addEventListener( 'selectstart', onSelectStart);
  controller1.addEventListener( 'selectend', onSelectEnd );
  // controller1.addEventListener("connected", (e) => {
  //   console.log(e.data.gamepad)
  // })
  controller1.addEventListener( 'connected', ( event )=> {
    if('gamepad' in event.data){
        if('axes' in event.data.gamepad){ //we have a modern controller
          controller1.gamepad = event.data.gamepad;
          console.log(controller1.gamepad.axes);
        }
    }
  });
  scene.add( controller1 );
  controller2 = renderer.xr.getController( 1 );
  controller2.addEventListener( 'selectstart', onSelectStart );
  controller2.addEventListener( 'selectend', onSelectEnd );
  controller2.addEventListener( 'connected', ( event )=> {
    if('gamepad' in event.data){
        if('axes' in event.data.gamepad){ //we have a modern controller
          controller2.gamepad = event.data.gamepad;
          console.log(controller2.gamepad.axes);
        }
    }
  });
  scene.add( controller2 );

  //コントローラーモデルを取得
  const controllerModelFactory = new XRControllerModelFactory();
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  scene.add( controllerGrip1 );
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  scene.add( controllerGrip2 );
  //コントローラーから出る光線の作成				
  const geo = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 )]);
  const mat = new THREE.LineBasicMaterial({color: 0xff0000});
  const line = new THREE.Line( geo , mat );
  line.name = 'line';
  line.scale.z = 1;//光線の長さ
  controller1.add( line.clone() );
  controller2.add( line.clone() );
  

  //機能
	function handleController( controller ) {
		const userData = controller.userData;
    //controller1 = controller;
		if ( userData.isSelecting == true ) {//コントローラーボタンが押された際の処理
      let xx = 0,yy = 100;
      //console.log(controller2);
      if(controller1.gamepad.buttons[0].pressed == true){
        //console.log(controller1.gamepad.buttons);
        xx = -50;
        //xx = controller1.gamepad.axes[0] * 100;
        //yy = controller2.gamepad.axes[0] * 100;
      }else if(controller1.gamepad.buttons[1].pressed == true){
        xx = 50;
        //xx = controller1.gamepad.axes[1] * 100;
        //yy = controller2.gamepad.axes[1] * 100;
      }else if(controller1.gamepad.buttons[2].pressed == true){
        xx = 150;
      }else if(controller1.gamepad.buttons[3].pressed == true){
        xx = 250;
      }else if(controller1.gamepad.buttons[4].pressed == true){
        xx = 350;
      }else if(controller1.gamepad.buttons[5].pressed == true){
        xx = 450;
      }else if(controller1.gamepad.buttons[6].pressed == true){
        xx = 550;
      }
      if(controller2.gamepad.buttons[0].pressed == true){
        yy = 50;
      //  xx = controller1.gamepad.axes[2] * 100;
      //  yy = controller2.gamepad.axes[2] * 100;
      }else if(controller2.gamepad.buttons[1].pressed == true){
        yy = 75;
        //xx = controller1.gamepad.axes[3] * 100;
        //yy = controller2.gamepad.axes[3] * 100;
      
      }else if(controller2.gamepad.buttons[2].pressed == true){
        yy = 125;
      }else if(controller2.gamepad.buttons[3].pressed == true){
        yy = 150;
      }else if(controller2.gamepad.buttons[4].pressed == true){
        yy = 175;
      }else if(controller2.gamepad.buttons[5].pressed == true){
        yy = 200;
      }else if(controller2.gamepad.buttons[6].pressed == true){
        yy = 225;
      }
      cube2.position.set( xx, yy, -500);
      //cameraContainer.position.x += 0.1;
      // cube.position.set(
      //   Math.random() * -1000 - 300,  // x座標を-5から5の範囲でランダムに設定
      //   0,  // y座標
      //   Math.random() * -1000 - 300   // z座標を-5から5の範囲でランダムに設定
      // );
      // scene.add(cube);
		} else {
      
		}
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

  // レンダラーにループ関数を登録
  renderer.setAnimationLoop(tick);
  
  // 毎フレーム時に実行されるループイベント
  function tick() {
    
    



    // レンダリング
    handleController( controller1 );
		handleController( controller2 );
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
