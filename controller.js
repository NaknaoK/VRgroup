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
let controller1, controller2;//1が左手、2が右手
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
  scene.background = new THREE.Color( 0xe0ffff );
  
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
  let trafficVolume = [];
  
  // カメラ用コンテナを作成(3Dのカメラを箱に入れて箱自体を動かす) 
  const cameraContainer = new THREE.Object3D();
  cameraContainer.position.set( 2, 200, 5 );
  cameraContainer.add(camera);
  scene.add(cameraContainer);
  
  //コントローラーのステック操作の閾値
  const threshold = 0.1;
  let VRconnect = false;

  //マップのデータ
  const CenterLatitude = 356791527,CenterLongitude = 1397686666;//中心の緯度,経度（度）
  const East = convertLatitudeAndLongitude("1394630000"),
        West = convertLatitudeAndLongitude("1394545000"),
        North = convertLatitudeAndLongitude("354060000"),
        South = convertLatitudeAndLongitude("354030000");
        console.log(East);
        console.log(West);
        console.log(North);
        console.log(South);
  // 光源を作成
  {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    //光源を作成
		const light = new THREE.DirectionalLight( 0xffffff, 2.5);
		light.position.set( 200, 400, 200 );
		scene.add( light );
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
  mapGroup.scale.set(1, 1, -1);//z軸が反転してしまうため行う

  /* ----Map関係---- */
  /* ----CSV関係---- */
  var req1 = new XMLHttpRequest(); // HTTPでファイルを読み込むためのXMLHttpRrequestオブジェクトを生成
  req1.open("get", "honhyo_2024.csv", true); // アクセスするファイルを指定
  req1.overrideMimeType("text/plain; charset=Shift_JIS");//文字コードの上書き
  req1.send(null); // HTTPリクエストの発行
  
  var accidentGroup = new THREE.Group();
  // レスポンスが返ってきたらconvertCSVtoArray()を呼ぶ	
  req1.onload = function(){
	  convertCSVtoArrayAccident(req1.responseText); // 渡されるのは読み込んだCSVデータ
    // console.log(trafficAccident[1][1]);
    // 追加 阿部
    for(let i = 1; i < trafficAccident.length; i++){
        if(trafficAccident[i][1] == 30){
          const data1 = convertLatitudeAndLongitude(trafficAccident[i][54]);
          if(South < data1 && data1 < North){//範囲内の緯度（度分秒）かを確認
            const data2 = convertLatitudeAndLongitude(trafficAccident[i][55]);
            // console.log(data2);
            if(West<data2 && data2<East){//範囲内の経度（度分秒）かを確認
              const num1 = CenterLatitude-data1;//中心からの距離、緯度（度）
              const num2 = data2-CenterLongitude;//中心からの距離、経度（度）
              let leverage1 = 0;//
              let leverage2 = 0;//
              //オブジェクトの中心がずれているため、正負によって処理を変える
              //※jsのZ軸は北が負、南が正（EUSになってる）※
              if(num1<0){//中心より北にある
                leverage1 = 484/(North-CenterLatitude);//
              }else{//中心より南にある
                leverage1 = 478/(CenterLatitude-South);//
              }
              if(num2<0){//中心より西にある
                leverage2 = 585/(CenterLongitude-West);//
              }else{//中心より東にある
                leverage2 = 575/(East-CenterLongitude);//
              }
              const posX = num2*leverage2-1;//経度からポジションを計算
              const posZ = num1*leverage1;//緯度からポジションを計算
              createAccidentPoint(posX, posZ, i);
              console.log(posX +"  "+posZ);
            }
          }
        }
    }
    
    createAccidentPoint(0, 0, 100);
    scene.add(accidentGroup);
    console.log(1);
    // createTrafficVolumeObject(5, 1, 0, 0, 0, 0, 0, trafficAccident[1][4]); //テストとして事故のデータを渡しているが、運用時は交通量に変更
  }
  
  var req2 = new XMLHttpRequest(); // HTTPでファイルを読み込むためのXMLHttpRrequestオブジェクトを生成
  req2.open("get", "zkntrf13.csv", true); // アクセスするファイルを指定
  req2.overrideMimeType("text/plain; charset=Shift_JIS");//文字コードの上書き
  req2.send(null); // HTTPリクエストの発行
  var volumeGroup = new THREE.Group();
  req2.onload = function(){
    convertCSVtoArrayVolume(req2.responseText);
    console.log(2);
  }


  function convertLatitudeAndLongitude(str){ //度分秒から度に変換する
    let strCount = str.toString().length;
    if(strCount == 9){//読み込んだ緯度のデータを変換する
      var deg = Number(str.slice(0,2));//度
      var min = Number(str.slice(2,4));//分
      var sec = Number(str.slice(4));//秒
      var result = Math.round((deg+min/60+sec/1/3600000)*10000000);
      return result;
    }else{//読み込んだ経度のデータを変換する
      var deg = Number(str.slice(0,3));//度
      var min = Number(str.slice(3,5));//分
      var sec = Number(str.slice(5));//秒
      var result = Math.round((deg+min/60+sec/1/3600000)*10000000);
      return result;
    }
  }

  function convertCSVtoArrayAccident(str){ // 読み込んだCSVデータが文字列として渡される
    let tmp = str.split("\n"); // 改行を区切り文字として行を要素とした配列を生成
    //各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
    for(var i=0;i<tmp.length;++i){
      trafficAccident[i] = tmp[i].split(',');
    }
  }
  function convertCSVtoArrayVolume(str){ // 読み込んだCSVデータが文字列として渡される
    let tmp = str.split("\n"); // 改行を区切り文字として行を要素とした配列を生成
    //各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
    for(var i=0;i<tmp.length;++i){
      trafficVolume[i] = tmp[i].split(',');
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
        if('axes' in event.data.gamepad){
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
        if('axes' in event.data.gamepad){
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
  const mat = new THREE.LineBasicMaterial({color: 0xf5f5f5});
  const line = new THREE.Line( geo , mat );
  line.name = 'line';
  line.scale.z = 10;//光線の長さ
  controller1.add( line.clone() );
  controller2.add( line.clone() );
  //詳細情報を表示する板
  let geometry = new THREE.BoxGeometry(0.2,0.2,0.01);
  // let material = new THREE.MeshLambertMaterial({color: 0x000000});
  // 各面に表示するテキスト
const texts = ["Front", "Back", "Top", "Bottom", "交通量", "Right"];

// マテリアルの設定
// let materials = [];
// for (let i = 0; i < 6; i++) {
//   if(i == 6){
//     const texture = new THREE.CanvasTexture(createTextCanvas(texts[i]));
//     materials.push(new THREE.MeshBasicMaterial({ map: texture }));
//   }else{
  let materials =new THREE.MeshLambertMaterial({color: 0x000000});
    // materials.push(new THREE.MeshLambertMaterial({color: 0x000000}));
    // materials[i].transparent = true;
    // materials[i].opacity = 0.5; 
  // }
// }
  let detailsObj = new THREE.Mesh(geometry, materials);
  detailsObj.position.set(0,0.1,0.05);
  detailsObj.material.transparent = true;
  detailsObj.material.opacity = 0.5; 
  controller2.add(detailsObj);
  detailsObj.visible = false;

  // テキストを描画するCanvasを作成する関数
function createTextCanvas(text) {
  const canvas = document.createElement('canvas');
  // const context = canvas.getContext('2d');
  const context = canvas.getContext('2d', {willReadFrequently:true});
  // context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '80px UTF-8';
  // context.fillStyle = 'black';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  let measure=context.measureText(text);
  canvas.width=measure.width;
  canvas.height=2*(measure.fontBoundingBoxAscent+measure.fontBoundingBoxDescent);
  console.log(context);
  context.font = '16px UTF-8';
  // context.fillStyle = 'black';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  //透明にする
  context.globalCompositeOperation = 'destination-out';
  context.fillStyle="rgb(255,255,255)";
  context.fillRect(0,0,canvas.width,canvas.height);
  //通常描画にする
  context.globalCompositeOperation = 'source-over';
  context.fillStyle='white';
  // context.fillText(text, canvas.width / 2, canvas.height / 2);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i],canvas.width / 2, canvas.height / 4 +i*30);
  }
  // context.fillText(text,Math.abs(measure.actualBoundingBoxLeft),measure.actualBoundingBoxAscent);
  let png=canvas.toDataURL('image/png');
  // return canvas;
  return {img:png, w:canvas.width, h:canvas.height};
}
  

  //機能
	function handleController1( controller ) {//controller1の処理
		const userData = controller.userData;
    const controllerData = controller.gamepad;
		if ( userData.isSelecting === true ) {//コントローラーボタンが押された際の処理
      
      if(controllerData.buttons[0].pressed == true){
        cameraContainer.position.y += controllerData.buttons[0].value;
      }else if(controllerData.buttons[1].pressed == true){
        cameraContainer.position.y -= controllerData.buttons[1].value;
      }else if(controllerData.buttons[2].pressed == true){
      }else if(controllerData.buttons[3].pressed == true){
      }else if(controllerData.buttons[4].pressed == true){
      }else if(controllerData.buttons[5].pressed == true){
      }else if(controllerData.buttons[6].pressed == true){
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
      // レイと交差しているシェイプの取得
      const intersections = getIntersections(controller);
      if(intersections.length > 0){//一つ以上交差している時処理する
        const intersection = intersections[0];
        const object = intersection.object;
        if(object.geometry.type == 'BoxGeometry'){//交通量の処理
          object.material.opacity = 1;
          intersected.push(object);
          // console.log(trafficAccident[0][7]);
          // console.log(object);
        }else if(object.geometry.type == 'CylinderGeometry'){//交通事故の処理
          object.material.color.g = 0.2;
          intersected.push(object);
          console.log(trafficAccident[100]);
        }
        // console.log(object);
        if(!detailsObj.visible){
          detailsObj.visible = true;
          //詳細表示の画像作成//////////////////////////////////////////////////////
          const N = object.name;
          let tet = "詳細\n";
          if(object.geometry.type == 'BoxGeometry'){//交通量の処理
          }else if(object.geometry.type == 'CylinderGeometry'){//交通事故の処理
            const tetTime ="日時 "+trafficAccident[N][11]+"/"+trafficAccident[N][12]+"/"+trafficAccident[N][13]+" "+trafficAccident[N][14]+":"+trafficAccident[N][15];
            tet = tet + tetTime;
          }
          // const tet = "道路\n番号"+"\n"+object.name;
          const png = createTextCanvas(tet);
          const textureText = new THREE.TextureLoader().load( png.img );
          const materialText=new THREE.MeshBasicMaterial({
            color:0xffffff, map:textureText ,side:THREE.FrontSide,
            transparent:true, opacity:1.0,
          });
          //平面ジオメトリの作成
          const planeGeo=new THREE.PlaneGeometry(png.w/1000, png.h/1000,1,1);
          //メッシュの作成
          const meshText=new THREE.Mesh(planeGeo,materialText);
          meshText.position.set(0, 0.01, 0.02);
          detailsObj.add(meshText);
          // const texture = new THREE.CanvasTexture(createTextCanvas(texts[4]));
          // const mate = new THREE.MeshBasicMaterial({ map: texture });
          // detailsObj.material[4] = mate;
          // materials[4].transparent = true;
          // materials[4].opacity = 1; 
          console.log(tet)
        }
      }
      // console.log(intersections);
    }else{//右コントローラのトリガーボタンが押されてない場合
      if(detailsObj.children){
        detailsObj.children.pop();
      }
      detailsObj.visible = false;
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
function createAccidentPoint(posX, posZ, num) {
  // var pin = new THREE.Group();
  // const geometry = new THREE.BoxGeometry(3,3,3);
  // const material = new THREE.MeshLambertMaterial({color: 0xffd700});
  // const cube = new THREE.Mesh(geometry, material);
  // cube.position.set(posX, 200, posZ);
  // cube.name = num;
  const ray = new THREE.Mesh(new THREE.CylinderGeometry(1,1,200),new THREE.MeshPhongMaterial({color: 0xFFd700}));
  ray.material.transparent = true;
  ray.position.set(posX, 100, posZ);
  ray.name = num;
  // pin.add(ray);
  // pin.add(cube);
  // pin.name = "pin";
  // accidentGroup.add(pin);
  accidentGroup.add(ray);
  // accidentGroup.add(cube);
  // console.log(accidentGroup);
}

//追加 阿部 交通量を表すオブジェクトの生成
function createTrafficVolumeObject(sizeX, sizeZ, posX, posY, posZ, rotX, rotY, trafficVolume){
  const geometry = new THREE.BoxGeometry(sizeX,1,sizeZ);
  let material = new THREE.MeshLambertMaterial({color: 0x0067C0}); //交通量が最低領域の場合の色を設定
  //交通量が多い場合は交通量の値が含まれる領域に応じて色を変更
  if(trafficVolume >= 2){ //領域（仮の値）
    material = new THREE.MeshLambertMaterial({color: 0xED1A3D});
  }else if(trafficVolume >= 1){
    material = new THREE.MeshLambertMaterial({color: 0xF58220});
  }
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(posX, posY, posZ);
  cube.rotation.set(rotX, rotY, 0);
  scene.add(cube);
}
/*--------↓接触処理----------*/
  // レイと交差しているシェイプの一覧
  const intersected = [];
  // ワーク行列
  const tempMatrix = new THREE.Matrix4();

  // レイキャスターの準備
  const raycaster = new THREE.Raycaster();
  // レイと交差しているシェイプの取得
  function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(accidentGroup.children, false);
  }
  // シェイプとコントローラのレイの交差判定のクリア
  function cleanIntersected() {
    while (intersected.length) {
      const object = intersected.pop();
      object.material.color.g = 0.85;
    }
    while(detailsObj.children.length>=2){
      // object.;
    }
  }
  // シェイプとコントローラのレイの交差判定
  function intersectObjects(controller) {
    // 選択時は無処理
    if (controller.userData.selected !== undefined) return;
    // レイと交差しているシェイプの取得
    const intersections = getIntersections(controller);
    if (intersections.length > 0) {
      // 交差時の処理
      const intersection = intersections[0];
      const object = intersection.object;
      object.material.color.g = 0.4;
      intersected.push(object);
    }
  }
/*--------↑接触処理----------*/
  // レンダラーにループ関数を登録
  renderer.setAnimationLoop(tick);
  
  // 毎フレーム時に実行されるループイベント
  function tick() {
    // レンダリング
    if(VRconnect){
      cleanIntersected();
      intersectObjects( controller2 );
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
