interface CameraInfo extends InputDeviceInfo {
    trackLabel: string;
    capabilities: DMMoreMediaTrackCapabilities;
}
interface DMMoreMediaTrackCapabilities extends MediaTrackCapabilities {
    focusMode?: ('continuous' | 'single-shot' | 'manual')[];
    focusDistance?: {
        max?: number;
        min: number;
    };
    zoom?: {
        max: number;
        min: number;
    };
    torch?: true;
}
interface Camera {
    /**
     * The `opened` event is triggered when the camera `open()` from the `paused`/`closed`
     * or when call `requestResolution()` and camera is `opened`.
     */
    addEventListener(type: 'opened', listener: (camera?: Camera) => void): void;
    removeEventListener(type: 'opened', listener: (camera?: Camera) => void): void;
}
declare class Camera {
    static _cameraNameMatcher: string[][];
    static _mapDeviceInfo: {
        [deviceId: string]: CameraInfo;
    };
    _coreShell: HTMLElement;
    _video: HTMLVideoElement;
    _coreInnerLayer: HTMLElement;
    _coreOuterLayer: HTMLElement;
    _regionBoxWrapper: HTMLElement;
    _regionBoxMask: HTMLElement;
    _regionBoxBorder: HTMLElement;
    _objectFit: 'contain' | 'cover' | 'fill';
    _uiInlineScript2Blob: boolean;
    _uiInternalCss2Blob: boolean;
    _uiInternalCss2ExistedSheet: boolean;
    _ui?: HTMLElement;
    _pOpen: Promise<void> & {
        isPending: boolean;
        resolve: () => void;
        reject: () => void;
    };
    _paused: boolean;
    _shouldClose: boolean;
    _cameraChangedWhenPaused: boolean;
    _resolutionChangedWhenPaused: boolean;
    _requestedCamera: CameraPreset | MediaTrackConstraints;
    _requestedResolution: MediaTrackConstraints;
    _regionBox: {
        width?: number;
        height?: number;
        unit: 'view-size' | 'view-min';
        center: {
            x: number;
            y: number;
        };
        maskStyle?: Partial<CSSStyleDeclaration>;
        borderStyle?: Partial<CSSStyleDeclaration>;
        innerUi?: Node | string;
    };
    _eventListeners: {
        [key: string]: Set<Function>;
    };
    static _arrConstructors: Function[];
    static _arrOnOpen: Function[];
    static _arrOnClose: Function[];
    constructor();
    _updateObjectFit(): void;
    get video(): HTMLVideoElement;
    get track(): MediaStreamTrack;
    get objectFit(): "contain" | "cover" | "fill";
    set objectFit(value: "contain" | "cover" | "fill");
    /**
     * While `ui` can accept various types during assignment, its value will always be an `HTMLElement` upon retrieval.
     */
    get ui(): HTMLElement;
    /**
     * Generally, the `value` can be an `HTMLElement`, `DocumentFragment` or a string of serialized html.
     * This `ui` or one of its descendants, must have class `dm-camera-core-container`.
     * If the `value` already contains the `coreShell`, `coreShell` does not move.
     * Otherwise the `coreShell` of `DMCamera` is appended to the first element that has the class `dm-camera-core-container`.
     *
     * If `value` is a falsy value, `coreShell` is used as `ui`.
     **/
    set ui(value: HTMLElement | DocumentFragment | string | undefined);
    get status(): CameraStatus;
    get requestedCamera(): "back" | "front" | "macro-back" | "quick-back" | "customized-video" | MediaTrackConstraints;
    get requestedResolution(): MediaTrackConstraints;
    get currentCamera(): CameraInfo;
    get currentResolution(): {
        width: number;
        height: number;
    };
    /** width 0 ~ 1, height 0 ~ 1, center.x -0.5 ~ 0.5, center.y -0.5 ~ 0.5 */
    get regionBox(): {
        width?: number;
        height?: number;
        unit: "view-size" | "view-min";
        center: {
            x: number;
            y: number;
        };
        maskStyle?: Partial<CSSStyleDeclaration>;
        borderStyle?: Partial<CSSStyleDeclaration>;
        innerUi?: Node | string;
    };
    onOpened: (camera: Camera) => void;
    static hasCamera(): Promise<boolean>;
    static hasMacroCamera(): Promise<boolean>;
    static getDeviceInfos(): Promise<Readonly<CameraInfo>[]>;
    static _setCapabilities(deviceInfos: CameraInfo[]): Promise<void>;
    /** `open()` is an idempotent operation, you can call it repeatedly without error. */
    open(): Promise<void>;
    /** `pause()` is an idempotent operation, you can call it repeatedly without error. */
    pause(): Promise<void>;
    /** `close()` is an idempotent operation, you can call it repeatedly without error. */
    close(): Promise<void>;
    /** If call `requestCamera()` when the camera is `opened`, it will call `close()` then re`open()` Internally. */
    requestCamera(cameraPreset: CameraPreset): Promise<void>;
    /** If call `requestCamera()` when the camera is `opened`, it will call `close()` then re`open()` Internally. */
    requestCamera(deviceId: string): Promise<void>;
    /** If call `requestCamera()` when the camera is `opened`, it will call `close()` then re`open()` Internally. */
    requestCamera(deviceInfo: CameraInfo): Promise<void>;
    /** If call `requestCamera()` when the camera is `opened`, it will call `close()` then re`open()` Internally. */
    requestCamera(constraints: MediaTrackConstraints): Promise<void>;
    /**
     * If call `requestCamera()` when the camera is `opened`, it will call `close()` then re`open()` Internally.
     * @param notRequired Let browser choose use what camera.
     * */
    requestCamera(notRequired: null): Promise<void>;
    /**
     * If call `requestCamera()` when the camera is `opened`, it will call `close()` then re`open()` Internally.
     * @param resetToDefault Use SDK's dafault logic.
     * */
    requestCamera(resetToDefault: undefined): Promise<void>;
    requestResolution(width: number, height?: number): Promise<void>;
    requestResolution(widthHeightPair: [number, number]): Promise<void>;
    requestResolution(constraints: {
        width?: ConstrainULong;
        height?: ConstrainULong;
        aspectRatio?: ConstrainDouble;
    }): Promise<void>;
    requestResolution(notRequired: null): Promise<void>;
    requestResolution(resetToDefault: undefined): Promise<void>;
    /**
     * @param config
     * `x`/`y`/`width`/`height` is normally `0 ~ video.videoWidth` or `0 ~ video.videoHeight`,
     * same as [drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage).
     * If values contain decimals, it will be rounded.
     * Note that the round method takes the effect of `x` into account when rounding `width` to minimize the cumulative error.
     * The same logic applies to `height`.
     */
    getFrame(config?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        reusedContext?: CanvasRenderingContext2D;
    }): HTMLCanvasElement;
    /**
     * @param regionBox width 0 ~ 1, height 0 ~ 1, center.x -0.5 ~ 0.5, center.y -0.5 ~ 0.5
     * TODO: support unit pixel
     */
    setRegionBox(regionBox: {
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
    }): void;
    /**
     * Add a canvas dynamically keep with the same size of the video resolution, as a overlay.
     * You can remove it by `camera.video.parentElement.remove(thatCanvas)` or `thatCanvas.remove()`.
     * When you add multiple canvases, you can also use `camera.video.parentElement` to control stack order.
     */
    addCanvas(): HTMLCanvasElement;
    _updateCanvasSize(): void;
    _callOpenedListeners(): void;
    /**
     * Convert video x/y to absolute left/top in `document.body`.
     * So you can easily add a overlay with absolute position.
     * Processing multiple points at once has higher performance than calling multiple times.
     */
    videoXY2AbsoluteLT(points: {
        x: number;
        y: number;
    }[]): {
        left: number;
        top: number;
    }[];
    /**
     * Convert video x/y to fixed left/top in `document.body`.
     * So you can easily add a overlay with fixed position.
     * Processing multiple points at once has higher performance than calling multiple times.
     */
    videoXY2FixedLT(points: {
        x: number;
        y: number;
    }[]): {
        left: number;
        top: number;
    }[];
    /**
     * @param isConsiderRegionBox Default is `false`. Only consider the visible area in the region box.
     * @param rounded Default is `false`. Controls whether the result should be rounded.
     * Note that the round method takes the effect of `x` into account when rounding `width` to minimize the cumulative error.
     * The same logic applies to `height`.
     * @returns
     * `x`/`width` is `0 ~ video.videoWidth`, `y`/`height` is `0 ~ video.videoHeight`.
     */
    getVisibleAreaInVideoXY(config: {
        isConsiderRegionBox?: boolean;
        rounded?: boolean;
    }): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
type CameraStatus = 'closed' | 'opening' | 'opened' | 'paused' | 'closing';
declare const ArrCameraPreset: readonly ["back", "front", "macro-back", "quick-back", "customized-video"];
type CameraPreset = typeof ArrCameraPreset[number];


    interface Camera {
        _softZoom: {
            zoom: number;
            center: {
                x: number;
                y: number;
            };
        };
        get softZoom(): {
            zoom: number;
            center: {
                x: number;
                y: number;
            };
        };
        _isMirrored: boolean;
        get isMirrored(): boolean;
        set isMirrored(value: boolean);
        maxZoom4GestureWheel: number;
        _lastZoomTime: number;
        _mapZoomTouchs: Map<number, {
            x: number;
            y: number;
        }>;
        _gestureZoomListener: EventListener;
        get enableGestureZoom(): boolean;
        set enableGestureZoom(value: boolean);
        _wheelZoomListener: EventListener;
        get enableWheelZoom(): boolean;
        set enableWheelZoom(value: boolean);
        getZoomRange(): {
            min: number;
            max: number;
        } | undefined;
        setZoom(zoom: number): Promise<void>;
        /**
         * Js software-level zoom.
         * It does not rely on camera device and camera driver support for zoom.
         * @param center
         * zoomed camera center in orignal frame.
         * `x`: -0.5 ~ 0.5, `y`: -0.5 ~ 0.5.
         * @param limit
         * limit `zoom` >= 1.
         * limit the center point position according to `zoom`,
         * so zoomed frame is inside video boundary;
         */
        setSoftZoom(zoom: number, config?: {
            center?: {
                x: number;
                y: number;
            };
            limit?: boolean;
        }): void;
        _changeZoomByWheel(ev: WheelEvent): void;
        _changeZoomByTouch(ev: TouchEvent): void;
        /** The `zoom` event is triggered when zoom updated via a touch gesture or mouse wheel. */
        addEventListener(type: 'zoom', listener: (softZoom?: {
            zoom: number;
            center: {
                x: number;
                y: number;
            };
        }, camera?: Camera) => void): void;
        removeEventListener(type: 'zoom', listener: (softZoom?: {
            zoom: number;
            center: {
                x: number;
                y: number;
            };
        }, camera?: Camera) => void): void;
    }

interface AdvancedFocusParameters {
    minFocusDistanceLimit?: number;
    maxFocusDistanceLimit?: number;
    firstStepWaitDuration?: number;
    coarseStepWaitDuration?: number;
    switchStepWaitDuration?: number;
    fineStepWaitDuration?: number;
    maxStepCount?: number;
    /** value < 0 means no never */
    backToContinousDuration?: number;
    /** The focus width and height, 0 ~ 1, represents the ratio of the length to the `Math.min(video.videoWidth, video.videoHeight)` */
    focusWH?: number;
    /** From far to near, 0 ~ 1. The closer to 1, the more sensitive but more slow. */
    coarseTuneRate?: number;
    /**
     * 0 ~ 1.
     * When the correct focus is closer, the far focus contrast data is unreliable
     * and requires a certain degree of error tolerance.
     * When closer to 1, it will be more sensitive to contrast changes and may also cause the focus to be too far.
     * When closer to 0, there will be more error tolerance,
     * and it may also cause the focus to be too close and the process to be too slow.
     **/
    coarseTuneTolerance?: number;
    /** From near to far, 1 ~ 1.xx. The closer to 1, the more sensitive but more slow. */
    fineTuneRate?: number;
}
declare namespace Camera {
        function _getImageContrast(data: Uint8Array | Uint8ClampedArray, width: number, height: number): number;
    }
    interface Camera {
        _enableTapToFocus: false | 'simple' | 'experimental-advanced';
        _isFocusing: boolean;
        _tapToFocusListner: EventListener;
        _simpleFocus(): Promise<void>;
        _advancedFocusParameters: AdvancedFocusParameters;
        _advancedFocusTaskId: number;
        _advancedFocus(center?: {
            x: number;
            y: number;
        }, width?: number, height?: number): Promise<void>;
        get enableTapToFocus(): false | "simple" | "experimental-advanced";
        set enableTapToFocus(value: false | 'simple' | 'experimental-advanced');
    }

interface AutoTorchParameters {
    shortDelay: number;
    longDelay: number;
    shortLongDelaySwitchCount: number;
    maxErrorCount: number;
    /** 0 ~ 255 */
    grayThreshold: number;
    maxDarkCount: number;
}

    interface Camera {
        get isSupportTorch(): boolean;
        _isTorchOn: boolean | undefined;
        /** `undefined` means in auto torch mode */
        get isTorchOn(): boolean | undefined;
        turnOnTorch(): Promise<void>;
        turnOffTorch(): Promise<void>;
        _autoTorchParameters: AutoTorchParameters;
        /**
         * Detect how dark the picture and turn on torch automatically.
         * After camera open, it may take a few seconds for picture to be ready.
         * So it's suggested not to `turnAutoTorch()` immediately.
         * Waiting for 3 seconds may bring a better user experience.
         **/
        turnAutoTorch(): void;
        /** The auto torch logic detected that the image was too dark and turn on the torch. */
        addEventListener(type: 'torchAutoOn', listener: (camera?: Camera) => void): void;
        removeEventListener(type: 'torchAutoOn', listener: (camera?: Camera) => void): void;
    }


    interface Camera {
        _shouldCloseWhenHide: boolean;
        _isOpenBeforeHide: boolean;
        _maxReopenTry4CloseWhenHide: number;
        get shouldCloseWhenHide(): boolean;
        set shouldCloseWhenHide(value: boolean);
        _closeWhenHide(): Promise<void>;
        _closeWhenHideListener: EventListener;
    }

/**
 * Return `Element` if possible, otherwise return `DocumentFragment`.
 */
declare const stringToHtml: (str: string, config?: {
    inlineScript2Blob?: boolean;
    internalCss2Blob: boolean;
    insertInternalCss2ExistedSheet?: boolean;
}) => Node;

declare class FramePipeline {
    camera: Camera;
    _ctx: CanvasRenderingContext2D;
    _data: Uint8Array;
    _dataTime: number;
    _x: number;
    _y: number;
    _w: number;
    _h: number;
    _type: string;
    maxTimeout: number;
    _pipeTaskId: any;
    isSaveOriginalRgba: boolean;
    /**
     * The `originalRgba` share `ArrayBuffer` with the `data` returned by `getData(..., type: 'rgba')`.
     * So you should be careful when transferring `data` to other thread.
     */
    originalRbga: Uint8ClampedArray;
    constructor(camera?: Camera);
    _getDate(): Uint8Array<ArrayBufferLike>;
    /**
     * @param config
     * Each parameter should be kept as stable as possible.
     * If you need to switch between multiple parameters frequently, please create multiple `FramePipeline` instances.
     */
    getData(config?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        type?: 'rgba' | 'gray';
    }): Uint8Array;
}

declare class Beep {
    _stAudioFree: Set<unknown>;
    _stAudioPlaying: Set<unknown>;
    _timeLastPlay: number;
    _bWarnedMaxTrack: boolean;
    maxPlayingBeep: number;
    beepSoundSource: string;
    beep(): void;
}
/**
 * The function will play the default beep sound.
 * To play different beep sound, you need create another `Beep` instance.
 **/
declare const beep: () => void;
declare const vibrate: (duration?: number) => void;

export { Beep, Camera, CameraPreset, CameraStatus, DMMoreMediaTrackCapabilities, FramePipeline, beep, stringToHtml, vibrate };
