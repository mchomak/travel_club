import { DEFAULT_SHAPE } from "./deformation";
import { DEFAULT_TIMING } from "./timeline";
export const DEFAULT_PARAMS = {
  distance: 9.1, fov: 32, pitch: 24, yaw: -8, roll: -2,
  scale: 1, tilt: -3, ...DEFAULT_SHAPE, thickness: .004,
  ambient: 2.2, key: 2.1, lightX: -3, lightY: 4, lightZ: 7,
  shadowStrength: .19, shadowSoftness: 3, ...DEFAULT_TIMING, debug: false,
};
export type SceneParams = typeof DEFAULT_PARAMS;
export type SliderKey = Exclude<keyof SceneParams, "debug">;
export const CONTROL_GROUPS: { title: string; sliders: { key: SliderKey; label: string; min: number; max: number; step: number }[] }[] = [
  { title: "Camera", sliders: [
    { key: "distance", label: "Distance", min: 7, max: 15, step: .1 },
    { key: "fov", label: "FOV", min: 24, max: 50, step: 1 },
    { key: "pitch", label: "Pitch", min: 0, max: 50, step: 1 },
    { key: "yaw", label: "Yaw", min: -30, max: 30, step: 1 },
    { key: "roll", label: "Roll", min: -15, max: 15, step: 1 },
  ] },
  { title: "Magazine", sliders: [
    { key: "scale", label: "Scale", min: .65, max: 1.3, step: .01 },
    { key: "tilt", label: "Overall tilt", min: -15, max: 15, step: 1 },
    { key: "thickness", label: "Page thickness", min: .002, max: .014, step: .001 },
  ] },
  { title: "Page", sliders: [
    { key: "bend", label: "Bend", min: .4, max: 2.8, step: .05 },
    { key: "curl", label: "Curl", min: 0, max: 1.6, step: .05 },
    { key: "stiffness", label: "Stiffness", min: 0, max: 1, step: .01 },
    { key: "lift", label: "Lift", min: 0, max: 1.5, step: .05 },
  ] },
  { title: "Light & shadow", sliders: [
    { key: "ambient", label: "Ambient intensity", min: .5, max: 4, step: .1 },
    { key: "key", label: "Main light intensity", min: .2, max: 5, step: .1 },
    { key: "lightX", label: "Light X", min: -8, max: 8, step: .25 },
    { key: "lightY", label: "Light Y", min: -8, max: 8, step: .25 },
    { key: "lightZ", label: "Light Z", min: 3, max: 12, step: .25 },
    { key: "shadowStrength", label: "Shadow strength", min: 0, max: .45, step: .01 },
    { key: "shadowSoftness", label: "Shadow softness", min: 1, max: 6, step: .25 },
  ] },
  { title: "Animation", sliders: [
    { key: "flipDuration", label: "Flip duration", min: .3, max: 2, step: .05 },
    { key: "delay", label: "Delay between flips", min: 0, max: .8, step: .02 },
  ] },
];
