import { 
  CoreModule, EnumCapturedResultItemType, EnumImagePixelFormat,
  LicenseManager, CaptureVisionRouter,
  BarcodeResultItem, MultiFrameResultCrossFilter,
} from 'dynamsoft-barcode-reader-bundle';
import { Camera, beep, vibrate, FramePipeline } from './dm-camera.esm';
//import MutablePromise from 'mutable-promise';


//The following code uses the jsDelivr CDN, feel free to change it to your own location of these files
CoreModule.engineResourcePaths.rootDirectory = 'https://cdn.jsdelivr.net/npm/';

if(typeof document != undefined){
  let cs = document?.currentScript;
  if(cs){
    let license = cs.getAttribute('data-license');
    if(license){ LicenseManager.license = license; }
  }
}

class EasyBarcodeScanner{
  static get license(){ return LicenseManager.license; }
  static set license(value: string){ LicenseManager.license = value; }

  /**
   * Presets: "ReadSingleBarcode", "ReadBarcodes_SpeedFirst"
   */
  templateName = "ReadBarcodes_SpeedFirst";
  
  _cvRouter: CaptureVisionRouter;
  _filter: MultiFrameResultCrossFilter;

  camera: Camera;
  _resultCtx?: CanvasRenderingContext2D;
  barcodeFillStyle: string | CanvasGradient | CanvasPattern = 'rgba(0,255,0,0.5)';
  barcodeStrokeStyle: string | CanvasGradient | CanvasPattern = 'rgba(0,255,0,1)';
  barcodeLineWidth = 1;
  _isBeepOnUniqueRead = true;
  get isBeepOnUniqueRead(){ return this._isBeepOnUniqueRead; }
  set isBeepOnUniqueRead(value: boolean){
    this._isBeepOnUniqueRead = value;
    const elBeepOn = this.camera.ui.querySelector('.dm-camera-mn-beep-on') as HTMLElement;
    const elBeepOff = this.camera.ui.querySelector('.dm-camera-mn-beep-off') as HTMLElement;
    if(value){
      if(elBeepOn){ elBeepOn.style.display = ''; }
      if(elBeepOff){ elBeepOff.style.display = 'none'; }
    }else{
      if(elBeepOn){ elBeepOn.style.display = 'none'; }
      if(elBeepOff){ elBeepOff.style.display = ''; }
    }
  }
  _isVibrateOnUniqueRead = false;
  get isVibrateOnUniqueRead(){ return this._isVibrateOnUniqueRead; }
  set isVibrateOnUniqueRead(value: boolean){
    this._isVibrateOnUniqueRead = value;
    const elVibrateOn = this.camera.ui.querySelector('.dm-camera-mn-vibrate-on') as HTMLElement;
    const elVibrateOff = this.camera.ui.querySelector('.dm-camera-mn-vibrate-off') as HTMLElement;
    if(value){
      if(elVibrateOn){ elVibrateOn.style.display = ''; }
      if(elVibrateOff){ elVibrateOff.style.display = 'none'; }
    }else{
      if(elVibrateOn){ elVibrateOn.style.display = 'none'; }
      if(elVibrateOff){ elVibrateOff.style.display = ''; }
    }
  }

  _framePipeline: FramePipeline;

  _bAddToBodyWhenOpen:boolean;

  decodeInterval = 100;

  get videoFit(){ return this.camera.objectFit; }
  set videoFit(value: "cover" | "contain" | "fill"){ this.camera.objectFit = value; }

  get decodedBarcodeVisible(){ return !!this._resultCtx; }
  set decodedBarcodeVisible(value: boolean){
    if(value){
      this._resultCtx ??= this.camera.addCanvas().getContext('2d');
    }else{
      this._resultCtx?.canvas.remove();
    }
  }

  _isSaveOriginalCanvas: boolean = false;
  get isSaveOriginalCanvas(){ return this._isSaveOriginalCanvas; }
  set isSaveOriginalCanvas(value: boolean){
    this._isSaveOriginalCanvas = value;
    this._framePipeline.isSaveOriginalRgba = value;
  }
  lastFrameSourceType: 'video'|'file';
  _originalImage: {
    canvas?:HTMLCanvasElement,
    u8?:Uint8ClampedArray, width?:number, height?:number };
  get originalCanvas(): HTMLCanvasElement{
    const oriImg = this._originalImage;
    if(oriImg?.canvas){return oriImg.canvas;}
    if(oriImg?.u8){
      // also save in oriImg, avoid multiple calculations when retrieving
      const cvs = oriImg.canvas = document.createElement('canvas');
      cvs.width = oriImg.width;
      cvs.height = oriImg.height;
      const ctx = cvs.getContext('2d');
      const imageData = new ImageData(oriImg.u8, oriImg.width, oriImg.height);
      ctx.putImageData(imageData, 0, 0);
      return cvs;
    }
    return null;
  }

  onFrameRead:(txts:string[], detail: { barcodeResultItems: BarcodeResultItem[], errorCode:number, errorString: string, })=>void|any;
  onUniqueRead:(txt:string, detail: { barcodeResultItem: BarcodeResultItem, errorCode:number, errorString: string, })=>void|any;

  static createInstance(): Promise<EasyBarcodeScanner>;
  static createInstance(uiPath: string): Promise<EasyBarcodeScanner>;
  static createInstance(uiElement: HTMLElement): Promise<EasyBarcodeScanner>;
  static createInstance(ui?: string | HTMLElement): Promise<EasyBarcodeScanner>;
  static async createInstance(ui: string | HTMLElement = 'https://cdn.jsdelivr.net/gh/Dynamsoft/easy-barcode-scanner@11.0.3001/mobile-native.ui.xml'){
    let scanner = new EasyBarcodeScanner();
    try{
      let cvRouter = scanner._cvRouter = await CaptureVisionRouter.createInstance();

      let camera = scanner.camera = new Camera();
      (camera as any).easyBarcodeScanner = scanner;
      if('string' === typeof ui && !ui.trimStart().startsWith('<')){
        let rep = await fetch(ui);
        if(!rep.ok){ throw Error("Failed to load the UI file from network."); }
        ui = await rep.text();
      }
      camera.ui = ui;

      scanner._framePipeline = new FramePipeline(camera);
      scanner.decodedBarcodeVisible = true;

      let filter = scanner._filter = new MultiFrameResultCrossFilter();
      filter.enableResultCrossVerification(EnumCapturedResultItemType.CRIT_BARCODE, true);
      filter.enableResultDeduplication(EnumCapturedResultItemType.CRIT_BARCODE, true);
      cvRouter.addResultFilter(filter);
    }catch(ex){
      scanner.dispose();
      throw ex;
    }

    return scanner;
  }

  getUIElement(){ return this.camera.ui; }

  setScanRegion(regionBox: {
    width?: number;
    height?: number;
    unit?: 'view-size' | 'view-min';
    center?: {
      x: number;
      y: number;
    };
    maskStyle?: Partial<CSSStyleDeclaration>;
    borderStyle?: Partial<CSSStyleDeclaration>;
    innerUi?: Node | string;
  }){
    this.camera.setRegionBox(regionBox);
  }

  async open(){
    if('opened' === this.camera.status){ return; }
    if('closed' === this.camera.status){
      let ui = this.camera.ui;
      if(!ui.parentElement){
        Object.assign(ui.style, {
          position: 'fixed',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
        });
        document.body.append(ui);
        this._bAddToBodyWhenOpen = true;
      }
    }

    await this.camera.open();

    if(this._isLoopingDecoding){ return; }
    this._isLoopingDecoding = true;
    this._loopDecoding(++this._loopDecodingTaskId);
  }
  close(){
    if(this._bAddToBodyWhenOpen){
      this._bAddToBodyWhenOpen = false;
      document.body.removeChild(this.camera.ui);
    }
    this._isLoopingDecoding = false;
    this.camera?.close();
  }
  pause(){
    this._isLoopingDecoding = false;
    this.camera.pause();
  }
  showOpenFilePicker(
    inputOptions?: {
      accept?: string,
      multiple?: boolean,
      onchange?:(this: HTMLInputElement, ev: Event)=>any,
      isSaveOriginalCanvas: boolean, // This para can override scanner's `isSaveOriginalCanvas`
    },
  ){
    let ipt = document.createElement('input');
    ipt.type = 'file';
    ipt.accept = 'image/jpeg, image/png, image/gif, image/bmp, image/webp, image/tiff';
    ipt.multiple = true;
    let isSaveOriginalCanvas = inputOptions?.isSaveOriginalCanvas;
    if(undefined === isSaveOriginalCanvas){ isSaveOriginalCanvas = this.isSaveOriginalCanvas; }
    delete inputOptions.isSaveOriginalCanvas;
    Object.assign(ipt, inputOptions);

    ipt.onchange ??= async()=>{
      let files = ipt.files;
      for(let file of files){
        let decodedBarcodesResult = await this.decodeFile(file, isSaveOriginalCanvas);
        let items = decodedBarcodesResult.barcodeResultItems || [];
        this.lastFrameSourceType = 'file';
        if(isSaveOriginalCanvas){
          this._originalImage = { canvas: decodedBarcodesResult.originalCanvas };
        }else{
          this._originalImage = null;
        }
        try{
          this.onFrameRead && this.onFrameRead(items.map(i=>i.text), {
            barcodeResultItems: items,
            errorCode: decodedBarcodesResult.errorCode,
            errorString: decodedBarcodesResult.errorString,
          });
        }catch(ex){
          setTimeout(()=>{throw ex;},0);
        }

        for(let item of items){
          if(!(item as any).duplicate){
            try{
              
              this.onUniqueRead && this.onUniqueRead(item.text, {
                barcodeResultItem: item,
                errorCode: decodedBarcodesResult.errorCode,
                errorString: decodedBarcodesResult.errorString,
              });
            }catch(ex){
              setTimeout(()=>{throw ex;},0);
            }
          }
        }
      }
    };
    ipt.click();
    return ipt;
  }
  async decodeFile(blob: Blob, isSaveOriginalCanvas: boolean = false): Promise<{ barcodeResultItems: BarcodeResultItem[], errorCode:number, errorString: string, originalCanvas?: HTMLCanvasElement }> {
    let url = URL.createObjectURL(blob);
    let img = document.createElement('img');
    let p = new Promise((rs,rj)=>{
      img.onload = rs;
      img.onerror = rj;
    });
    img.src = url;
    try{
      await p;
    }finally{
      URL.revokeObjectURL(url);
    }
    let cvs = document.createElement('canvas');
    cvs.width = img.naturalWidth;
    cvs.height = img.naturalHeight;
    let ctx = cvs.getContext('2d');
    ctx.drawImage(img,0,0);
    let u8 = ctx.getImageData(0,0,cvs.width,cvs.height).data;
    let ret = await this.decodeBuffer(u8, cvs.width, cvs.height, cvs.width*4, EnumImagePixelFormat.IPF_ABGR_8888, this.templateName);
    if(isSaveOriginalCanvas){
      (ret as any).originalCanvas = cvs;
    }
    return ret;
  }
  async decodeBuffer(bytes: Uint8Array|Uint8ClampedArray, width: number, height: number,
    stride: number, format: EnumImagePixelFormat, templateName: string = ''):
    Promise<{ barcodeResultItems: BarcodeResultItem[], errorCode:number, errorString: string }>
  {

    let captureResult = await this._cvRouter.capture({
      bytes: bytes as Uint8Array,
      width,
      height,
      stride,
      format,
    },templateName);

    return captureResult.decodedBarcodesResult || {
      barcodeResultItems: [] as BarcodeResultItem[],
      errorCode: captureResult.errorCode,
      errorString: captureResult.errorString,
    };
  }

  _loopDecodingTaskId = 0;
  _isLoopingDecoding: boolean = false;
  async _loopDecoding(taskId:number){
    if(!this._isLoopingDecoding || taskId != this._loopDecodingTaskId){ return; }
    if('opened' != this.camera.status){
      await new Promise(rs=>setTimeout(rs, 500));
      this._loopDecoding(taskId);
      return;
    }
    try{
      let {x, y, width, height} = this.camera.getVisibleAreaInVideoXY({isConsiderRegionBox: true, rounded: true});
      let bytes = this._framePipeline.getData({x, y, width, height, type: 'gray'});
      let originalRbga = this._framePipeline.originalRbga;

      let decodedBarcodesResult = await this.decodeBuffer(bytes, width, height, width, EnumImagePixelFormat.IPF_GRAYSCALED, this.templateName);
      if(!this._isLoopingDecoding || taskId != this._loopDecodingTaskId){ return; }

      this.lastFrameSourceType = 'video';
      if(this.isSaveOriginalCanvas && originalRbga){
        this._originalImage = {u8: originalRbga, width, height};
      }
      let items = decodedBarcodesResult.barcodeResultItems || [];
      try{
        this.onFrameRead && this.onFrameRead(items.map(i=>i.text), decodedBarcodesResult);
      }catch(ex){
        setTimeout(()=>{throw ex;},0);
      }

      let hasUnique = false;
      for(let item of items){
        if(!(item as any).duplicate){
          hasUnique = true;
          try{
            this.onUniqueRead && this.onUniqueRead(item.text, {
              barcodeResultItem: item,
              errorCode: decodedBarcodesResult.errorCode,
              errorString: decodedBarcodesResult.errorString,
            });
          }catch(ex){
            setTimeout(()=>{throw ex;},0);
          }
        }
      }

      if(this._resultCtx){
        const ctx = this._resultCtx;
        const cvs = ctx.canvas;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = this.barcodeFillStyle;
        ctx.strokeStyle = this.barcodeStrokeStyle;
        ctx.lineWidth = this.barcodeLineWidth;
        for(let i of items){
          let p = i.location.points;
          ctx.beginPath();
          ctx.moveTo(p[0].x + x, p[0].y + y);
          ctx.lineTo(p[1].x + x, p[1].y + y);
          ctx.lineTo(p[2].x + x, p[2].y + y);
          ctx.lineTo(p[3].x + x, p[3].y + y);
          ctx.fill();
          ctx.closePath();
          ctx.stroke();
        }
      }
      if(hasUnique && this.isBeepOnUniqueRead){ beep(); }
      if(hasUnique && this.isVibrateOnUniqueRead){ vibrate(); }
    }catch(ex){
      setTimeout(()=>{throw ex;},0);
      await new Promise(rs=>setTimeout(rs, 1000));
    }

    await new Promise(rs=>setTimeout(rs, this.decodeInterval));
    this._loopDecoding(taskId);
  }

  async turnOnTorch(){
    await this.camera.turnOnTorch();
    const elTorchAuto = this.camera.ui.querySelector('.dm-camera-mn-torch-auto') as HTMLElement;
    if(elTorchAuto){ elTorchAuto.style.display = 'none'; }
    const elTorchOn = this.camera.ui.querySelector('.dm-camera-mn-torch-on') as HTMLElement;
    if(elTorchOn){ elTorchOn.style.display = ''; }
    const elTorchOff = this.camera.ui.querySelector('.dm-camera-mn-torch-off') as HTMLElement;
    if(elTorchOff){ elTorchOff.style.display = 'none'; }
  }
  async turnOffTorch(){
    this.camera.turnOffTorch();
    const elTorchAuto = this.camera.ui.querySelector('.dm-camera-mn-torch-auto') as HTMLElement;
    if(elTorchAuto){ elTorchAuto.style.display = 'none'; }
    const elTorchOn = this.camera.ui.querySelector('.dm-camera-mn-torch-on') as HTMLElement;
    if(elTorchOn){ elTorchOn.style.display = 'none'; }
    const elTorchOff = this.camera.ui.querySelector('.dm-camera-mn-torch-off') as HTMLElement;
    if(elTorchOff){ elTorchOff.style.display = ''; }
  }
  turnAutoTorch(){
    if(!this.camera.isSupportTorch){
      throw Error('Torch Not Supported');
    }
    this.camera.turnAutoTorch();
    const elTorchAuto = this.camera.ui.querySelector('.dm-camera-mn-torch-auto') as HTMLElement;
    if(elTorchAuto){ elTorchAuto.style.display = ''; }
    const elTorchOn = this.camera.ui.querySelector('.dm-camera-mn-torch-on') as HTMLElement;
    if(elTorchOn){ elTorchOn.style.display = 'none'; }
    const elTorchOff = this.camera.ui.querySelector('.dm-camera-mn-torch-off') as HTMLElement;
    if(elTorchOff){ elTorchOff.style.display = 'none'; }
  }

  videoXY2AbsoluteLT(points: {x:number, y:number}[]){ return this.camera.videoXY2AbsoluteLT(points); }
  videoXY2FixedLT(points: {x:number, y:number}[]){ return this.camera.videoXY2FixedLT(points); }
  getVisibleAreaInVideoXY(config: {isConsiderRegionBox?: boolean, rounded?: boolean}){ return this.camera.getVisibleAreaInVideoXY(config); }

  dispose(){
    this.close();
    this._cvRouter?.dispose();
  }

  static scan(): Promise<string>;
  static scan(uiPath: string): Promise<string>;
  static scan(uiElement: HTMLElement): Promise<string>;
  static scan(ui?: string | HTMLElement): Promise<string>;
  static async scan(ui: string | HTMLElement = 'https://cdn.jsdelivr.net/gh/Dynamsoft/easy-barcode-scanner@11.0.3001/easy-barcode-scanner.ui.xml'){
    return await new Promise(async(rs,rj)=>{

      //========================== init ============================

      let scanner = await EasyBarcodeScanner.createInstance(ui);

      //========================== receive result ============================
      let pBarcodeResults = new Promise<BarcodeResultItem[]>(resolveBarcodeResults=>{
        // let iRound = 0;
        scanner.onFrameRead = (txts, { barcodeResultItems })=>{
          if(barcodeResultItems?.length){
            //// 1D barcode need 2 frame to comfirm
            //// so if you need choose between 1D and QR in one frame, you need `iRound`
            // if(2 == ++iRound){ rs(barcodeResults); }
            //// we don't use `iRound` for faster result
            resolveBarcodeResults(barcodeResultItems);
          }else{// No result
            if('file' === scanner.lastFrameSourceType){ 
              // `mnFuncShowToast` is function provide by `easy-barcode-scanner.ui.xml`
              (scanner as any).mnFuncShowToast?.("No barcode found in the file.");
            }
          }
        };
      });
      
      //========================== ui and event ============================
      let uiElement = scanner.getUIElement();

      let btnClose = uiElement.querySelector('.easyscanner-close-btn');
      btnClose.addEventListener('click',()=>{
        scanner.dispose();
        rs(null);
      });

      uiElement.querySelector('.easyscanner-photo-album-btn').addEventListener('click', ()=>{
        scanner.showOpenFilePicker({multiple: false, isSaveOriginalCanvas: true});
      });

      // torch has another style, you can check html part
      uiElement.querySelector('.easyscanner-flash-btn').addEventListener('pointerdown', ()=>{
        let els = uiElement.querySelectorAll('.dm-camera-mn-torch > svg');
        for(let el of els){
          if('none'!=(el as HTMLElement).style.display){
            el.dispatchEvent(new Event('pointerdown'));
            break;
          }
        }
      });

      // easyscanner-more-settings-btn not used

      let isImageMode = false;
      if(await Camera.hasCamera()){
        try{
          await scanner.open();
        }catch(ex){
          console.warn(ex);
          isImageMode = true;
        }
      }
      if(isImageMode){
        console.warn('No camera available, failback to image mode.');
        scanner.showOpenFilePicker({multiple: false, isSaveOriginalCanvas: true});
      }

      let barcodeResults = await pBarcodeResults;
      //========================== success get result ============================

      // never
      if(0 === barcodeResults.length){ scanner.dispose();rs(null);return; }

      if(1 === barcodeResults.length){
        scanner.dispose();
        rs(barcodeResults[0].text);
        return;
      }

      if('file' === scanner.lastFrameSourceType){
        const cvs = scanner.originalCanvas;
        Object.assign(cvs.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: 'black',
        });
        uiElement.appendChild(cvs);
      }


      let mask = document.createElement('div');
      mask.className = 'easyscanner-barcode-result-select-mask';
      uiElement.append(mask);

      let pChooseResult = new Promise<string>(rs=>{
        let arrCenterInAlgorithm: {x: number, y: number}[] = [];
        for(let barcodeResult of barcodeResults){
          let xSum = 0, ySum = 0;
          for(let i = 0; i < 4; ++i){
            let p = barcodeResult.location.points[i];
            xSum += p.x;
            ySum += p.y;
          }
          arrCenterInAlgorithm.push({x: xSum/4, y: ySum/4});
        }
        let arrCenterFixed: {left: number, top: number}[] = [];

        if('video' === scanner.lastFrameSourceType){
          let {x, y} = scanner.getVisibleAreaInVideoXY({isConsiderRegionBox: true, rounded: true});
          let arrCenterInVideo = arrCenterInAlgorithm.map(i=>({x: i.x + x, y: i.y + y}))
          arrCenterFixed = scanner.videoXY2FixedLT(arrCenterInVideo);
        }
        else if('file' === scanner.lastFrameSourceType){
          let vw = document.documentElement.clientWidth;
          let vh = document.documentElement.clientHeight;
          let cvs = scanner.originalCanvas;

          //canvas native size
          let cnw = cvs.width;
          let cnh = cvs.height;
          //canvas show size
          let csw = vw;
          let csh = vh;
          // canvas left top in pixel
          let cl = 0;
          let ct = 0;
          if(vw/vh > cnw/cnh){
            csw = csh / cnh * cnw;
            cl = (vw - csw) / 2;
          }else{
            csh = csw / cnw * cnh;
            ct = (vh - csh) / 2;
          }

          arrCenterFixed = arrCenterInAlgorithm.map(i=>({left: cl + i.x / cnw * csw, top: ct + i.y / cnh * csh}));
        }
        else{
          throw Error(`unknown frame source type: ${scanner.lastFrameSourceType}`);
        }

        for(let barcodeResult of barcodeResults){
          let option = document.createElement('div');
          option.className = 'easyscanner-barcode-result-option';
          let {left, top} = arrCenterFixed.shift();
          option.style.left = left + 'px';
          option.style.top = top + 'px';
          option.addEventListener('click',()=>{
            rs(barcodeResult.text);
          });
          uiElement.append(option);
        }
      });

      let tip = document.createElement('div');
      tip.className = 'easyscanner-barcode-result-select-tip';
      tip.textContent = 'Multiple scans found, please select one.';
      uiElement.append(tip);

      uiElement.append(btnClose);

      //if('disabled' === scanner._cameraEnhancer.singleFrameMode){ scanner.pause(); }
      scanner.pause();

      let txtResult = await pChooseResult;

      scanner.dispose();

      rs(txtResult);
    });
  }
}

export default EasyBarcodeScanner;

