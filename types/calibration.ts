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
    // ... existing existing existing
    startedAt: string;
    completedAt?: string;
    recommendations?: AIRecommendation;
    previewParams?: {
        brightness: number;
        contrast: number;
        gamma: number;
        temperature: number;
    };
}

export interface AIRecommendation {
    colorTemperature: number;
    gamma: number;
    whiteBalance: {
        r: number;
        g: number;
        b: number;
    };
    deltaE: {
        before: number;
        after: number;
    };
    description: string;
}
