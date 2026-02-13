export interface DisplayProfile {
    id?: string;
    name: string;
    resolution: {
        width: number;
        height: number;
    };
    refreshRate: number;
    panelType: 'OLED' | 'LCD' | 'MicroLED' | 'Other';
    brightnessRange: {
        min: number;
        max: number;
    };
    gammaTarget: number;
    createdAt?: string;
}

export interface CalibrationSession {
    id?: string;
    deviceId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    step: number;
    config: {
        brightness: number;
        contrast: number;
        patternType: 'grayscale' | 'colorchecker' | 'checkerboard';
    };
    results?: {
        measuredGamma: number;
        lut?: number[];
        cameraMatrix?: number[][];
        distCoeffs?: number[];
    };
    startedAt: string;
    completedAt?: string;
}
