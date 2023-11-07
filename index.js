<!DOCTYPE html>
<html>
<head>
	<title>VRpaint</title>
	<meta charset="utf-8">
	<link type="text/css" rel="stylesheet" href="main.css">
</head>
<body>
<script type="module">
	//インポート．
	import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
	import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
	import { TubePainter } from 'https://unpkg.com/three@0.126.1/examples/jsm/misc/TubePainter.js';
	import { VRButton } from 'https://unpkg.com/three@0.126.1/examples/jsm/webxr/VRButton.js';
	import { XRControllerModelFactory } from 'https://unpkg.com/three@0.126.1/examples/jsm/webxr/XRControllerModelFactory.js';
	import { GUI } from 'https://unpkg.com/three@0.147.0/examples/jsm/libs/lil-gui.module.min.js';

	let camera, scene, renderer;
	let controller1, controller2;
	let controllerGrip1, controllerGrip2;
	const cursor = new THREE.Vector3();

	let raycaster;
	let controls;
	let group;
	//要素
	const params = {
		scale:1.0,//グリッドのサイズ変更
		visible: true//グリッドを表示・非表示にする
	};
	init();
	animate();

	function init() {
		//ノードの要素作成
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		//シーン、カメラの作成
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x222222);
		camera=new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
		camera.position.set( 0, 3.6, 8 );
		//PC上で滑らかにカメラコントローラーを制御する
		controls = new OrbitControls( camera, container );
		controls.target.set( 0, 1.6, 0 );
		controls.update();

		//立方体のグリッドの作成とグループ化
		group = new THREE.Group();
		scene.add( group);
		let g=new THREE.MeshBasicMaterial({color:0xc0c0c0});
		for(let i=0;i<6;i++){
			for(let j=1;j<2;j+=0.2){
			//gridheiper 大きさ・分割数・センタラインカラー・マスカラ―
			let grid1 =new THREE.GridHelper(1,5,g,g);
			grid1.name='grid1';
			grid1.myid=i;
			grid1.rotation.x=0;
			grid1.position.y=j;
			grid1.position.z=0;
			group.add(grid1);	
			}	
		}
		for(let k=0;k<6;k++){
			for(let n=-0.5;n<0.7;n+=0.2){
			let grid2 =new THREE.GridHelper(1,5,g,g);
			grid2.name='grid2';
			grid2.myid=k;
			grid2.rotation.x=Math.PI/2;
			grid2.position.y=1.5;
			grid2.position.z=n;
			group.add(grid2);	
			}				
		}	
		//床を作成
		const gridHelper = new THREE.GridHelper(10,5,0xffffff,0xffffff);scene.add(gridHelper);
		const pg = new THREE.PlaneGeometry( 10, 10 );
		const pm = new THREE.MeshBasicMaterial( {color: 0x808080, side: THREE.DoubleSide} );
		const plane = new THREE.Mesh(pg, pm); plane.rotation.x =-Math.PI/2;
		scene.add( plane );
		scene.add( new THREE.HemisphereLight( 0x888877, 0x777788 ) );
		//光源を作成
		const light = new THREE.DirectionalLight( 0xffffff, 0.5 );
		light.position.set( 0, 4, 0 );
		scene.add( light );

		//ペイントする機能
		const painter1 = new TubePainter();
		scene.add( painter1.mesh );
		const painter2 = new TubePainter();
		scene.add( painter2.mesh )
		//レンダラー
		renderer = new THREE.WebGLRenderer( { antialias: true} );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.outputEncoding = THREE.sRGBEncoding;
		renderer.xr.enabled = true; // レンダラーのXRを有効化
		container.appendChild( renderer.domElement );
		document.body.appendChild( VRButton.createButton( renderer ) );// ボタンをアクティブにすると、VRセッションが開始
				
		//要素の設定
		const gui = new GUI( { width: 300 } );
		gui.add( params ,'scale' ,0.1,2.0).step(0.1).onChange( function(val){
			group.scale.set(val,val, val);
		});
		gui.add( params, 'visible' ).onChange( function(visible){
			group.visible=visible;
		} );
		gui.open();
				
		// コントローラーイベントの設定
		function onSelectStart() {
			this.userData.isSelecting = true;
		}
		function onSelectEnd() {
			this.userData.isSelecting = false;
		}				
		//コントローラー取得
		controller1 = renderer.xr.getController( 0 );
		controller1.addEventListener( 'selectstart', onSelectStart );
		controller1.addEventListener( 'selectend', onSelectEnd );
		controller1.userData.painter = painter1;
		scene.add( controller1 );
		controller2 = renderer.xr.getController( 1 );
		controller2.addEventListener( 'selectstart', onSelectStart );
		controller2.addEventListener( 'selectend', onSelectEnd );
		controller2.userData.painter = painter2;
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
		const line = new THREE.Line( geo );
		line.name = 'line';
		line.scale.z = 5;
		controller1.add( line.clone() );
		controller2.add( line.clone() );

		//ペイントチューブの作成
		const geometry = new THREE.CylinderGeometry( 0.01, 0.02, 0.08, 5 );
		geometry.rotateX( - Math.PI / 2 );
		const material = new THREE.MeshStandardMaterial( { flatShading: true } );
		const mesh = new THREE.Mesh( geometry, material );
		const pivot = new THREE.Mesh( new THREE.IcosahedronGeometry( 0.01, 3 ) );
		pivot.name = 'pivot';
		pivot.position.z = - 0.05;
		mesh.add( pivot );
		controller1.add( mesh.clone() );
		controller2.add( mesh.clone() );

		window.addEventListener( 'resize', onWindowResize );//リサイズ処理
	}
		
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	//ペイント機能
	function handleController( controller ) {
		const userData = controller.userData;
		const painter = userData.painter;
		const pivot = controller.getObjectByName( 'pivot' );
		cursor.setFromMatrixPosition( pivot.matrixWorld );
		if ( userData.isSelecting === true ) {//コントローラーボタンが押された際の処理
			painter.lineTo( cursor );
			painter.update();
		} else {
			painter.moveTo( cursor );
		}
	}
	function animate() {
		renderer.setAnimationLoop( render );
	}
	function render() {
		handleController( controller1 );
		handleController( controller2 );
		renderer.render( scene, camera );
	}
</script>
</body>
</html>
