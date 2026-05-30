import { Billboard, PerspectiveCamera, Text, useAnimations, useGLTF, useTexture } from '@react-three/drei'
import { Canvas, ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

import avatarFaceFragmentShader from './shaders/avatar-face/fragment.glsl'
import avatarFaceVertexShader from './shaders/avatar-face/vertex.glsl'
import avatarHeadFragmentShader from './shaders/avatar-head/fragment.glsl'
import avatarHeadVertexShader from './shaders/avatar-head/vertex.glsl'
import hologramFragmentShader from './shaders/hologram/fragment.glsl'
import hologramVertexShader from './shaders/hologram/vertex.glsl'
import avatarMatcapFragmentShader from './shaders/avatar-matcap/fragment.glsl'
import avatarMatcapVertexShader from './shaders/avatar-matcap/vertex.glsl'
import darkPlaneFragmentShader from './shaders/dark-plane/fragment.glsl'
import darkPlaneVertexShader from './shaders/dark-plane/vertex.glsl'
import desktopsFragmentShader from './shaders/desktops/fragment.glsl'
import desktopsVertexShader from './shaders/desktops/vertex.glsl'
import gridFloorFragmentShader from './shaders/grid-floor/fragment.glsl'
import gridFloorVertexShader from './shaders/grid-floor/vertex.glsl'
import labBaseFragmentShader from './shaders/lab-base/fragment.glsl'
import labBaseVertexShader from './shaders/lab-base/vertex.glsl'
import labElectricFragmentShader from './shaders/lab-electric/fragment.glsl'
import labElectricVertexShader from './shaders/lab-electric/vertex.glsl'
import labParticlesFragmentShader from './shaders/lab-particles/fragment.glsl'
import labParticlesVertexShader from './shaders/lab-particles/vertex.glsl'
import labShineFragmentShader from './shaders/lab-shine/fragment.glsl'
import labShineVertexShader from './shaders/lab-shine/vertex.glsl'
import shadowFragmentShader from './shaders/shadow-catcher/fragment.glsl'
import shadowVertexShader from './shaders/shadow-catcher/vertex.glsl'

type PortfolioCanvasProps = {
  sceneState: SceneState
  activeProject: number
  ready?: boolean
  className?: string
}

type MeshMap = Record<string, THREE.Mesh | THREE.SkinnedMesh>

export type SceneState = {
  hero: number
  heroOut: number
  about: number
  aboutIn: number
  aboutOut: number
  aboutProgress: number
  aboutStage: number
  projects: number
  contact: number
  contactIn: number
}

const damp = THREE.MathUtils.damp
const mix = THREE.MathUtils.lerp
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number, min: number, max: number) => THREE.MathUtils.smoothstep(value, min, max)
const getBlinkFrame = (time: number) => {
  const phase = time % 5
  if (phase < 0.11) return 0
  if (phase < 0.145) return 1
  if (phase < 0.18) return 2
  if (phase < 0.215) return 3
  if (phase < 0.25) return 2
  if (phase < 0.285) return 1
  return 0
}

const roomModel = '/reference/models/room.glb'
const avatarModel = '/reference/models/avatar.glb'
const labModel = '/reference/models/lab.glb'
const contactModel = '/reference/models/contact.glb'

const roomTexturePath = '/reference/textures/room.webp'
const desktopsTexturePath = '/reference/textures/desktops.webp'
const roomShadowTexturePath = '/reference/textures/room-shadow.webp'
const matcapBlackPath = '/reference/textures/matcap-black.webp'
const matcapGrayPath = '/reference/textures/matcap-gray.webp'
const matcapSkinPath = '/reference/textures/matcap-skin.webp'
const matcapWhitePath = '/reference/textures/matcap-white.webp'
const headTexturePath = '/reference/textures/head.webp'
const faceTexturePath = '/reference/textures/face-spritesheet.png'
const diffuseMapPath = '/reference/textures/diffuse-map.png'
const hologramPlaneTexturePath = '/reference/textures/hologram-plane.webp'
const contactTexturePath = '/reference/textures/contact.webp'
const contactShadowTexturePath = '/reference/textures/contact-shadow.webp'
const musicGlyphPosition: [number, number, number] = [-1.68, 2.35, -1.95]

export const getSceneStateFromProgress = (progress: number): SceneState => {
  const heroOut = smooth(progress, 0.08, 0.22)
  const aboutIn = smooth(progress, 0.08, 0.2)
  const aboutOut = smooth(progress, 0.52, 0.64)
  const aboutProgress = smooth(progress, 0.1, 0.56)
  const aboutStage = smooth(progress, 0.28, 0.54)
  const projects = smooth(progress, 0.58, 0.68) * (1 - smooth(progress, 0.74, 0.84))
  const contactIn = smooth(progress, 0.78, 0.94)

  return {
    hero: 1 - heroOut,
    heroOut,
    about: aboutIn * (1 - aboutOut),
    aboutIn,
    aboutOut,
    aboutProgress,
    aboutStage,
    projects,
    contact: contactIn,
    contactIn,
  }
}

const setBakedTexture = (texture: THREE.Texture) => {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = false
  texture.needsUpdate = true
}

const setLinearTexture = (texture: THREE.Texture, flipY = false) => {
  texture.colorSpace = THREE.LinearSRGBColorSpace
  texture.flipY = flipY
  texture.generateMipmaps = false
  texture.needsUpdate = true
}

const setDesktopTexture = (texture: THREE.Texture) => {
  texture.colorSpace = THREE.LinearSRGBColorSpace
  texture.flipY = false
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
}

const collectMeshes = (scene: THREE.Object3D) => {
  const meshes: MeshMap = {}
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
      meshes[child.name] = child
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
    }
  })
  return meshes
}

const setShaderSkinning = (material: THREE.ShaderMaterial) => {
  ;(material as THREE.ShaderMaterial & { skinning?: boolean }).skinning = true
  return material
}

const FACE_FRAMES = {
  default0: 0,
  default1: 1,
  default2: 2,
  default3: 3,
  sleeping: 4,
  transition0: 8,
  transition1: 9,
  transition2: 10,
  proud0: 12,
  proud1: 13,
  proud2: 14,
  proud3: 15,
} as const

const HOLOGRAM_ACTION_NAMES = ['idle', 't-idle', 'left-desktop', 'wave'] as const

const withDesktopAttributes = (mesh: THREE.Mesh | THREE.SkinnedMesh, scroll: number, message: number) => {
  const geometry = mesh.geometry
  const count = geometry.attributes.position.count

  if (!geometry.getAttribute('scrollIntensity')) {
    geometry.setAttribute('scrollIntensity', new THREE.BufferAttribute(new Float32Array(count).fill(scroll), 1))
  }

  if (!geometry.getAttribute('messageIntensity')) {
    geometry.setAttribute('messageIntensity', new THREE.BufferAttribute(new Float32Array(count).fill(message), 1))
  }
}

function CameraRig({ sceneState }: { sceneState: SceneState }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const focus = useMemo(() => new THREE.Vector3(0, 3, 0), [])
  const targetFocus = useMemo(() => new THREE.Vector3(), [])
  const targetPosition = useMemo(() => new THREE.Vector3(), [])
  const heroPosition = useMemo(() => new THREE.Vector3(), [])
  const aboutPosition = useMemo(() => new THREE.Vector3(), [])
  const contactPosition = useMemo(() => new THREE.Vector3(), [])
  const heroFocus = useMemo(() => new THREE.Vector3(), [])
  const aboutFocus = useMemo(() => new THREE.Vector3(), [])
  const contactFocus = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const isPortrait = size.height > size.width
    const heroWeight = Math.max(0, sceneState.hero)
    const aboutWeight = Math.max(0, sceneState.about)
    const totalWeight = Math.max(0.001, heroWeight + aboutWeight)

    if (isPortrait) {
      heroPosition.set(0, 8.2, 16)
      heroFocus.set(0, 5.2, 0)
      aboutPosition.set(0, 5.1, 21.1)
      aboutFocus.set(0, 0.95, 6)
      contactPosition.set(0, -8, 12)
      contactFocus.set(0, -9.4, 0)
    } else {
      heroPosition.set(0, 6, 10)
      heroFocus.set(0, 3, 0)
      aboutPosition.set(0, 5.05 - sceneState.aboutOut * 1.55, 21.2)
      aboutFocus.set(0, 0.38, 6)
      contactPosition.set(0, -8.5, 9)
      contactFocus.set(0, -10.5, 0)
    }

    targetPosition
      .copy(heroPosition)
      .multiplyScalar(heroWeight / totalWeight)
      .addScaledVector(aboutPosition, aboutWeight / totalWeight)
      .lerp(contactPosition, sceneState.contact)

    targetFocus
      .copy(heroFocus)
      .multiplyScalar(heroWeight / totalWeight)
      .addScaledVector(aboutFocus, aboutWeight / totalWeight)
      .lerp(contactFocus, sceneState.contact)

    const parallaxX = (state.pointer.x || 0) * 0.22
    const parallaxY = (state.pointer.y || 0) * 0.16

    camera.position.x = damp(camera.position.x, targetPosition.x + parallaxX, 4, delta)
    camera.position.y = damp(camera.position.y, targetPosition.y + parallaxY, 4, delta)
    camera.position.z = damp(camera.position.z, targetPosition.z, 4, delta)

    focus.lerp(targetFocus, 1 - Math.exp(-delta * 4.8))
    camera.lookAt(focus)
  })

  return null
}

function RoomModel({ progress, activeProject }: PortfolioCanvasProps) {
  const root = useRef<THREE.Group>(null)
  const gltf = useGLTF(roomModel)
  const roomTexture = useTexture(roomTexturePath)
  const desktopsTexture = useTexture(desktopsTexturePath)
  const roomShadowTexture = useTexture(roomShadowTexturePath)
  const size = useThree((state) => state.size)
  const meshes = useMemo(() => collectMeshes(gltf.scene), [gltf.scene])
  const desktopUniforms = useMemo(
    () => ({
      uTexture: { value: desktopsTexture },
      uScrollDepth: { value: 0 },
      uMessageIntensity: { value: 0 },
    }),
    [desktopsTexture],
  )
  const roomMaterial = useMemo(() => new THREE.MeshBasicMaterial({ map: roomTexture }), [roomTexture])
  const desktopMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: desktopsVertexShader,
        fragmentShader: desktopsFragmentShader,
        uniforms: desktopUniforms,
      }),
    [desktopUniforms],
  )
  const shadowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shadowVertexShader,
        fragmentShader: shadowFragmentShader,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTexture: { value: roomShadowTexture },
          uColorBackground: { value: new THREE.Color('#f5efe6') },
          uColorShadow: { value: new THREE.Color('rgb(215, 194, 169)') },
        },
      }),
    [roomShadowTexture],
  )

  useEffect(() => {
    setBakedTexture(roomTexture)
    setDesktopTexture(desktopsTexture)
    setBakedTexture(roomShadowTexture)
  }, [desktopsTexture, roomShadowTexture, roomTexture])

  useEffect(() => {
    Object.values(meshes).forEach((mesh) => {
      mesh.material = mesh.name === 'shadow-catcher' ? shadowMaterial : roomMaterial
    })

    if (meshes['desktop-plane-0']) {
      withDesktopAttributes(meshes['desktop-plane-0'], 1, 0)
      meshes['desktop-plane-0'].material = desktopMaterial
    }

    if (meshes['desktop-plane-1']) {
      withDesktopAttributes(meshes['desktop-plane-1'], 0, 1)
      meshes['desktop-plane-1'].material = desktopMaterial
    }

    const carpet = meshes.carpet
    if (carpet) {
      carpet.renderOrder = -10
      carpet.onBeforeRender = () => {
        roomMaterial.depthWrite = false
      }
      carpet.onAfterRender = () => {
        roomMaterial.depthWrite = true
      }
    }

    const shadow = meshes['shadow-catcher']
    if (shadow) shadow.renderOrder = -1000
  }, [desktopMaterial, meshes, roomMaterial, shadowMaterial])

  useFrame((state, delta) => {
    if (!root.current) return

    const sceneState = progress
    const isPortrait = size.height > size.width
    const about = sceneState.aboutIn
    const aboutStage = sceneState.aboutStage
    const isHeroPhase = sceneState.hero > 0.85 && sceneState.aboutIn < 0.05
    const targetScale = mix(1, 0.85, about)
    const targetX = isPortrait ? 0 : mix(2, 4.5, about)
    const targetY = isPortrait ? about * 5.4 : about * 5.7
    const targetRotY = isPortrait ? -2.1 : -2.3

    root.current.visible = isHeroPhase || sceneState.hero > 0.0001 || sceneState.heroOut < 0.999
    root.current.scale.setScalar(damp(root.current.scale.x, targetScale, 4, delta))
    root.current.position.x = damp(root.current.position.x, targetX, 4, delta)
    root.current.position.y = damp(root.current.position.y, targetY, 4, delta)
    root.current.rotation.x = damp(root.current.rotation.x, isPortrait ? 0 : about * 0.1, 4, delta)
    root.current.rotation.y = damp(root.current.rotation.y, targetRotY, 4, delta)
    root.current.rotation.z = damp(root.current.rotation.z, isPortrait ? 0 : about * 0.09, 4, delta)

    desktopUniforms.uScrollDepth.value = Math.sin(state.clock.elapsedTime * 0.45 + activeProject * 0.35) * 0.08
    desktopUniforms.uMessageIntensity.value = sceneState.hero * 0.15

    const chair = meshes.chair
    if (chair) {
      chair.rotation.y = damp(chair.rotation.y, about * -1.1, 4, delta)
      chair.rotation.x = damp(chair.rotation.x, about * -0.9, 4, delta)
      chair.rotation.z = damp(chair.rotation.z, about * -1.3, 4, delta)
    }

    const penguin = meshes.penguin
    if (penguin) {
      penguin.rotation.z = Math.sin(state.clock.elapsedTime * 2.2) * 0.045
    }

    const room = meshes.room
    if (room && !isPortrait) {
      room.position.y = damp(room.position.y, aboutStage * 0.02, 4, delta)
    }

    const display = meshes['desktop-plane-0']
    const displayTwo = meshes['desktop-plane-1']
    if (display) display.rotation.z = damp(display.rotation.z, about * -0.02, 4, delta)
    if (displayTwo) displayTwo.rotation.z = damp(displayTwo.rotation.z, about * 0.015, 4, delta)
  })

  return (
    <group ref={root} position={[2, 0, 0]} rotation-y={-2.3}>
      <primitive object={gltf.scene} />
      <FloatingGlyphs progress={progress} position={musicGlyphPosition} variant="notes" />
    </group>
  )
}

function AvatarModel({ progress, ready = false }: { progress: SceneState; ready?: boolean }) {
  const base = useGLTF(avatarModel)
  const avatarRoot = useMemo(() => cloneSkeleton(base.scene.children[0]) as THREE.Object3D, [base.scene])
  const hologramRoot = useMemo(() => cloneSkeleton(base.scene.children[0]) as THREE.Object3D, [base.scene])
  const group = useRef<THREE.Group>(null)
  const { actions, mixer } = useAnimations(base.animations, avatarRoot)
  const hologramMixer = useMemo(() => new THREE.AnimationMixer(hologramRoot), [hologramRoot])
  const black = useTexture(matcapBlackPath)
  const gray = useTexture(matcapGrayPath)
  const skin = useTexture(matcapSkinPath)
  const white = useTexture(matcapWhitePath)
  const head = useTexture(headTexturePath)
  const face = useTexture(faceTexturePath)
  const meshes = useMemo(() => collectMeshes(avatarRoot), [avatarRoot])
  const hologramMeshes = useMemo(() => collectMeshes(hologramRoot), [hologramRoot])
  const hologramActions = useMemo(() => {
    const map = new Map<string, THREE.AnimationAction>()
    base.animations.forEach((clip) => {
      if (HOLOGRAM_ACTION_NAMES.includes(clip.name as (typeof HOLOGRAM_ACTION_NAMES)[number])) {
        map.set(clip.name, hologramMixer.clipAction(clip))
      }
    })
    return map
  }, [base.animations, hologramMixer])
  const avatarUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uAmbientStrength: { value: 0 },
    }),
    [],
  )
  const faceUniform = useMemo(() => ({ uFrame: { value: 0 } }), [])
  const hologramUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('rgb(0, 234, 255)') },
      uProgress: avatarUniforms.uProgress,
    }),
    [avatarUniforms],
  )
  const blinkFrame = useRef(0)
  const waveStrength = useRef(1)
  const waveFaceCountdown = useRef(3)
  const waveDurationRef = useRef(1.5)
  const wakePhase = useRef<'sleeping' | 'transition-0' | 'transition-1' | 'transition-2' | 'proud'>('sleeping')
  const wakeTriggered = useRef(false)
  const faceTimeline = useRef(0)
  const wakeMotionTime = useRef(0)
  const wakeDurationRef = useRef(0.8)
  const waveStarted = useRef(false)

  useEffect(() => {
    avatarRoot.rotation.z = 0
    hologramRoot.rotation.z = 0

    ;[black, gray, skin, white].forEach((texture) => setLinearTexture(texture, true))
    setLinearTexture(head, false)
    setLinearTexture(face, true)

    const materialFor = (name: string) => {
      if (name === 'head') {
        return setShaderSkinning(
          new THREE.ShaderMaterial({
            vertexShader: avatarHeadVertexShader,
            fragmentShader: avatarHeadFragmentShader,
            transparent: true,
            uniforms: {
              uHeadTexture: { value: head },
              ...avatarUniforms,
            },
          }),
        )
      }

      if (name === 'face') {
        return setShaderSkinning(
          new THREE.ShaderMaterial({
            vertexShader: avatarFaceVertexShader,
            fragmentShader: avatarFaceFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
              uTexture: { value: face },
              ...faceUniform,
              ...avatarUniforms,
            },
          }),
        )
      }

      const matcap = name === 'gray' ? gray : name === 'skin' ? skin : name === 'white' ? white : black
      return setShaderSkinning(
        new THREE.ShaderMaterial({
          vertexShader: avatarMatcapVertexShader,
          fragmentShader: avatarMatcapFragmentShader,
          transparent: true,
          uniforms: {
            uMatcap: { value: matcap },
            ...avatarUniforms,
          },
        }),
      )
    }

    Object.values(meshes).forEach((mesh) => {
      if (mesh.name === 'brain') {
        mesh.visible = false
      }
      mesh.material = materialFor(mesh.name)
      mesh.renderOrder = mesh.name === 'face' ? 25 : 24
    })
  }, [avatarUniforms, black, face, faceUniform, gray, head, meshes, skin, white])

  useEffect(() => {
    const hologramMaterial = setShaderSkinning(
      new THREE.ShaderMaterial({
        vertexShader: hologramVertexShader,
        fragmentShader: hologramFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: hologramUniforms,
      }),
    )

    Object.values(hologramMeshes).forEach((mesh) => {
      if (mesh.name === 'face' || mesh.name === 'brain') {
        mesh.visible = false
        return
      }
      mesh.material = hologramMaterial
      mesh.renderOrder = 23
    })
  }, [hologramMeshes, hologramUniforms])

  useEffect(() => {
    const looping = ['idle', 't-idle', 'sleeping', 'contact-idle'] as const
    looping.forEach((key) => {
      const action = actions[key]
      if (!action) return
      action.reset().setLoop(THREE.LoopPingPong, Infinity).play()
      action.weight = key === 'idle' || key === 'sleeping' ? 1 : 0
    })

    const wave = actions.wave
    if (wave) {
      wave.reset().setLoop(THREE.LoopOnce, 1)
      wave.clampWhenFinished = true
      wave.weight = 0
      waveDurationRef.current = wave.getClip().duration
    }

    const wake = actions['wake-up']
    if (wake) {
      wake.setLoop(THREE.LoopOnce, 1)
      wake.clampWhenFinished = true
      wakeDurationRef.current = wake.getClip().duration
    }
  }, [actions])

  useEffect(() => {
    ;(['idle', 't-idle'] as const).forEach((key) => {
      const action = hologramActions.get(key)
      if (!action) return
      action.reset().setLoop(THREE.LoopPingPong, Infinity).play()
      action.weight = key === 'idle' ? 1 : 0
    })

    const wave = hologramActions.get('wave')
    if (wave) {
      wave.reset().setLoop(THREE.LoopOnce, 1)
      wave.clampWhenFinished = true
      wave.weight = 0
    }
  }, [hologramActions])

  useEffect(() => {
    if (!ready || waveStarted.current) return
    const wave = actions.wave
    if (!wave) return
    const hologramWave = hologramActions.get('wave')

    waveStarted.current = true
    waveStrength.current = 1
    waveFaceCountdown.current = 3
    wave.reset().play()
    wave.weight = 1
    hologramWave?.reset().play()
    if (hologramWave) {
      hologramWave.weight = 1
    }
  }, [actions, hologramActions, ready])

  useFrame((state, delta) => {
    const sceneState = progress
    const isPortrait = state.size.height > state.size.width
    const contact = sceneState.contact
    const introWeight = 1 - contact
    const isHeroPhase = sceneState.hero > 0.85 && sceneState.aboutIn < 0.05
    const idle = actions.idle
    const tIdle = actions['t-idle']
    const sleeping = actions.sleeping
    const contactIdle = actions['contact-idle']
    const wakeUp = actions['wake-up']
    const wave = actions.wave

    if (contact < 0.001 && waveStrength.current > 0) {
      waveStrength.current = Math.max(0, waveStrength.current - delta / Math.max(waveDurationRef.current, 0.001))
      waveFaceCountdown.current = Math.max(0, waveFaceCountdown.current - delta)
    }

    if (contact < 0.001) {
      wakeTriggered.current = false
      wakePhase.current = 'sleeping'
      faceTimeline.current = 0
      wakeMotionTime.current = 0
      if (wakeUp) wakeUp.weight = 0
    } else {
      if (!wakeTriggered.current && contact > 0.32) {
        wakeTriggered.current = true
        wakePhase.current = 'transition-0'
        faceTimeline.current = 0
        wakeMotionTime.current = 0
        if (wakeUp) {
          wakeUp.reset().play()
          wakeUp.weight = 1
        }
      }

      if (wakeTriggered.current && wakePhase.current !== 'proud') {
        faceTimeline.current += delta
        wakeMotionTime.current += delta

        if (faceTimeline.current < 0.4) {
          wakePhase.current = 'transition-0'
        } else if (faceTimeline.current < 0.43) {
          wakePhase.current = 'transition-1'
        } else if (faceTimeline.current < 0.46) {
          wakePhase.current = 'transition-2'
        } else {
          wakePhase.current = 'proud'
        }
      }
    }

    const wakeBlend = wakeTriggered.current ? clamp01(wakeMotionTime.current / 0.22) : 0
    const wakeDone = wakeTriggered.current ? clamp01(wakeMotionTime.current / Math.max(wakeDurationRef.current, 0.001)) : 0

    if (idle) idle.weight = (1 - sceneState.aboutIn) * Math.max(0, 1 - waveStrength.current) * introWeight
    if (tIdle) tIdle.weight = sceneState.aboutIn * introWeight
    if (sleeping) sleeping.weight = contact * (1 - wakeBlend)
    if (contactIdle) {
      contactIdle.weight = wakePhase.current === 'proud' ? contact : contact * Math.max(0, wakeDone - 0.55) * 2.2
    }
    if (wakeUp) wakeUp.weight = wakeTriggered.current && wakePhase.current !== 'proud' ? contact * 1.15 : 0
    if (wave) wave.weight = Math.max(0, waveStrength.current) * (1 - sceneState.aboutIn)

    const hologramIdle = hologramActions.get('idle')
    const hologramTIdle = hologramActions.get('t-idle')
    const hologramWave = hologramActions.get('wave')

    if (hologramIdle) hologramIdle.weight = (1 - sceneState.aboutIn) * Math.max(0, 1 - waveStrength.current) * introWeight
    if (hologramTIdle) hologramTIdle.weight = sceneState.aboutIn * introWeight
    if (hologramWave) hologramWave.weight = Math.max(0, waveStrength.current) * (1 - sceneState.aboutIn)

    avatarUniforms.uProgress.value = contact > 0.001 ? 0 : sceneState.aboutProgress * 1.1 - 0.1
    avatarUniforms.uAmbientStrength.value = sceneState.aboutIn * introWeight
    hologramUniforms.uTime.value = state.clock.elapsedTime

    blinkFrame.current = getBlinkFrame(state.clock.elapsedTime)

    if (contact < 0.001 && waveFaceCountdown.current > 0) {
      faceUniform.uFrame.value = FACE_FRAMES.proud0
    } else if (contact < 0.001) {
      if (sceneState.aboutIn > 0.12) {
        faceUniform.uFrame.value = FACE_FRAMES.default0
      } else {
        faceUniform.uFrame.value =
          blinkFrame.current === 3
            ? FACE_FRAMES.default3
            : blinkFrame.current === 2
              ? FACE_FRAMES.default2
              : blinkFrame.current === 1
                ? FACE_FRAMES.default1
                : FACE_FRAMES.default0
      }
    } else {
      if (wakePhase.current === 'sleeping') {
        faceUniform.uFrame.value = FACE_FRAMES.sleeping
      } else if (wakePhase.current === 'transition-0') {
        faceUniform.uFrame.value = FACE_FRAMES.transition0
      } else if (wakePhase.current === 'transition-1') {
        faceUniform.uFrame.value = FACE_FRAMES.transition1
      } else if (wakePhase.current === 'transition-2') {
        faceUniform.uFrame.value = FACE_FRAMES.transition2
      } else {
        faceUniform.uFrame.value =
          blinkFrame.current === 3
            ? FACE_FRAMES.proud3
            : blinkFrame.current >= 2
              ? FACE_FRAMES.proud2
              : blinkFrame.current >= 1
                ? FACE_FRAMES.proud1
                : FACE_FRAMES.proud0
      }
    }

    mixer.update(delta)
    hologramMixer.update(delta)

    if (!group.current) return

    const aboutStartX = isPortrait ? 0 : 2
    const aboutStartRotation = (isPortrait ? -2.1 : -2.3) + Math.PI / 2
    const introX = mix(aboutStartX, 0, sceneState.aboutIn)
    const introY = isPortrait ? -0.45 * sceneState.aboutIn : -1.9 * sceneState.aboutIn
    const introZ = 6 * sceneState.aboutIn
    const introRotation = mix(aboutStartRotation, -Math.PI, sceneState.aboutIn)
    const introScale = isPortrait ? mix(1, 0.95, sceneState.aboutIn) : mix(1, 0.93, sceneState.aboutIn)

    group.current.visible = isHeroPhase || sceneState.hero > 0.0001 || sceneState.about > 0.001 || contact > 0.001
    group.current.position.x = damp(group.current.position.x, mix(introX, 0, contact), 4, delta)
    group.current.position.y = damp(group.current.position.y, mix(introY, -13, contact), 4, delta)
    group.current.position.z = damp(group.current.position.z, mix(introZ, 0, contact), 4, delta)
    group.current.rotation.y = damp(group.current.rotation.y, mix(introRotation, -Math.PI, contact), 4, delta)
    group.current.scale.setScalar(damp(group.current.scale.x, mix(introScale, 1, contact), 4, delta))
    avatarRoot.visible = contact < 0.999 || wakePhase.current !== 'sleeping'
    hologramRoot.visible = sceneState.aboutIn > 0.06 && sceneState.aboutOut < 0.88 && contact < 0.001
  })

  return (
    <group ref={group} position={[2, 0, 0]} rotation-y={-2.3 + Math.PI / 2}>
      <primitive object={avatarRoot} />
      <primitive object={hologramRoot} />
    </group>
  )
}

function LabModel({ progress }: { progress: SceneState }) {
  const root = useRef<THREE.Group>(null)
  const gltf = useGLTF(labModel)
  const meshes = useMemo(() => collectMeshes(gltf.scene), [gltf.scene])
  const diffuseMap = useTexture(diffuseMapPath)
  const hologramPlaneTexture = useTexture(hologramPlaneTexturePath)
  const labUniforms = useMemo(() => ({ uProgress: { value: 0 } }), [])
  const shineUniforms = useMemo(() => ({ uTime: { value: 0 }, uProgress: { value: 0 } }), [])
  const electricUniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }), [])
  const baseMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: labBaseVertexShader,
        fragmentShader: labBaseFragmentShader,
        transparent: true,
        uniforms: {
          uDiffuseMap: { value: diffuseMap },
          ...labUniforms,
        },
      }),
    [diffuseMap, labUniforms],
  )
  const shineMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: labShineVertexShader,
        fragmentShader: labShineFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        uniforms: shineUniforms,
      }),
    [shineUniforms],
  )
  const electricMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: labElectricVertexShader,
        fragmentShader: labElectricFragmentShader,
        transparent: true,
        uniforms: electricUniforms,
      }),
    [electricUniforms],
  )

  useEffect(() => {
    setLinearTexture(diffuseMap, false)
    setLinearTexture(hologramPlaneTexture, false)

    Object.values(meshes).forEach((mesh) => {
      if (mesh.name === 'shine') {
        mesh.material = shineMaterial
        mesh.renderOrder = 30
      } else if (mesh.name === 'electric') {
        mesh.material = electricMaterial
        mesh.renderOrder = 25
      } else {
        mesh.material = baseMaterial
        mesh.renderOrder = mesh.name === 'display' ? 21 : 20
      }
    })
  }, [baseMaterial, diffuseMap, electricMaterial, hologramPlaneTexture, meshes, shineMaterial])

  useFrame((state, delta) => {
    if (!root.current) return
    const sceneState = progress

    root.current.visible = sceneState.aboutIn > 0.04 && sceneState.aboutOut < 0.92
    root.current.position.y = damp(root.current.position.y, sceneState.about > 0.001 ? 0 : -0.9, 4, delta)
    root.current.scale.setScalar(damp(root.current.scale.x, mix(0.88, 1, sceneState.aboutIn), 4, delta))

    labUniforms.uProgress.value = sceneState.aboutProgress
    shineUniforms.uTime.value = state.clock.elapsedTime
    shineUniforms.uProgress.value = sceneState.aboutProgress
    electricUniforms.uTime.value = state.clock.elapsedTime
    electricUniforms.uOpacity.value =
      sceneState.aboutIn * (0.18 + Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.62) * (1 - sceneState.aboutOut * 0.45)

    const display = meshes.display
    if (display) display.visible = state.size.width >= state.size.height
  })

  return (
    <group ref={root} position={[0, 0, 6]} visible={false}>
      <primitive object={gltf.scene} />
      <HologramPlane texture={hologramPlaneTexture} progress={progress} />
      <HologramProgress progress={progress} />
      <GridFloor progress={progress} />
      <LabParticles progress={progress} />
    </group>
  )
}

function GridFloor({ progress }: { progress: SceneState }) {
  const mesh = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#0157a0').convertLinearToSRGB() },
      uLineColor: { value: new THREE.Color('#34bcfd').convertLinearToSRGB() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uProgress: { value: 0 },
    }),
    [],
  )

  useFrame((state) => {
    const sceneState = progress
    uniforms.uOpacity.value = sceneState.about * (0.18 + 0.82 * sceneState.aboutIn) * (1 - sceneState.aboutOut * 0.28)
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uProgress.value = sceneState.aboutProgress
    if (mesh.current) {
      mesh.current.visible = sceneState.aboutIn > 0.05 && sceneState.aboutOut < 0.92
    }
  })

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, -0.4, 6]} renderOrder={-100} visible={false}>
      <planeGeometry args={[18, 18, 18, 18]} />
      <shaderMaterial
        vertexShader={gridFloorVertexShader}
        fragmentShader={gridFloorFragmentShader}
        transparent
        depthWrite={false}
        depthTest
        uniforms={uniforms}
      />
    </mesh>
  )
}

function DarkPlane({ progress }: { progress: SceneState }) {
  const mesh = useRef<THREE.Mesh>(null)
  const size = useThree((state) => state.size)
  const uniforms = useMemo(
    () => ({
      uTexture: { value: null },
      uVignetteColor: { value: new THREE.Color('rgb(0, 15, 61)') },
      uAngle: { value: 0 },
      uRectSize: { value: new THREE.Vector2(0.55, 0.5) },
      uRectCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uRadius: { value: 0.05 },
      uAspectRatio: { value: 1 },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (!mesh.current) return
    const sceneState = progress
    const inProgress = sceneState.aboutIn
    const outProgress = sceneState.aboutOut
    const visible = inProgress > 0.001 && outProgress < 0.999
    const isLandscape = size.width >= size.height
    const aspectRatio = size.width / Math.max(1, size.height)

    mesh.current.visible = visible
    uniforms.uAspectRatio.value = aspectRatio
    uniforms.uRadius.value = (size.width >= 840 ? 48 : 24) / Math.max(1, size.height)

    const sizeValue = mix(0.55, isLandscape ? 0.5 : 0.35, inProgress)
    uniforms.uRectSize.value.set(sizeValue * aspectRatio, 0.5)
    uniforms.uRectCenter.value.set(
      0.5 + (isLandscape ? 0.2 : 0) * inProgress,
      0.5 + inProgress * (isLandscape ? 1.1 : 1.02),
    )
    uniforms.uAngle.value = damp(uniforms.uAngle.value, (isLandscape ? 0.075 : 0) * inProgress, 4, delta)
  })

  return (
    <mesh ref={mesh} renderOrder={10} frustumCulled={false} visible={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={darkPlaneVertexShader}
        fragmentShader={darkPlaneFragmentShader.replace('vec4 color = texture2D(uTexture, vUv);', 'vec4 color = vec4(0.0, 0.12, 0.42, 1.0);')}
        depthTest={false}
        depthWrite={false}
        transparent
        uniforms={uniforms}
      />
    </mesh>
  )
}

function LabParticles({ progress }: { progress: SceneState }) {
  const points = useRef<THREE.Points>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScaleMultiplier: { value: 1 },
    }),
    [],
  )
  const geometry = useMemo(() => {
    const particleCount = 70
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const offsets = new Float32Array(particleCount)
    const angles = new Float32Array(particleCount)
    const radii = new Float32Array(particleCount)
    const speeds = new Float32Array(particleCount)
    const drifts = new Float32Array(particleCount * 2)
    const noiseOffsets = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const color = new THREE.Color(0.1, 0.808, 1.0)

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 1
      const intensity = 0.55 + Math.random() * 0.45
      const particleColor = color.clone().multiplyScalar(intensity)

      angles[i] = angle
      radii[i] = radius
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = 0
      positions[i3 + 2] = Math.sin(angle) * radius
      offsets[i] = Math.random() * 4
      speeds[i] = 0.7 + Math.random() * 0.6
      drifts[i * 2] = (Math.random() - 0.5) * 0.3
      drifts[i * 2 + 1] = (Math.random() - 0.5) * 0.3
      noiseOffsets[i3] = Math.random() * 100
      noiseOffsets[i3 + 1] = Math.random() * 100
      noiseOffsets[i3 + 2] = Math.random() * 100
      sizes[i] = 0.6 + Math.random() * 0.8
      colors[i3] = particleColor.r
      colors[i3 + 1] = particleColor.g
      colors[i3 + 2] = particleColor.b
    }

    const bufferGeometry = new THREE.BufferGeometry()
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    bufferGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    bufferGeometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1))
    bufferGeometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1))
    bufferGeometry.setAttribute('radius', new THREE.BufferAttribute(radii, 1))
    bufferGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1))
    bufferGeometry.setAttribute('drift', new THREE.BufferAttribute(drifts, 2))
    bufferGeometry.setAttribute('noiseOffset', new THREE.BufferAttribute(noiseOffsets, 3))
    bufferGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return bufferGeometry
  }, [])

  useFrame((state) => {
    const sceneState = progress
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uScaleMultiplier.value = 0.72 + 0.28 * sceneState.aboutProgress
    if (points.current) {
      points.current.visible = sceneState.about > 0.02
    }
  })

  return (
    <points ref={points} geometry={geometry} position={[0, 0, 6]} renderOrder={22} frustumCulled={false} visible={false}>
      <shaderMaterial
        vertexShader={labParticlesVertexShader}
        fragmentShader={labParticlesFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexColors
      />
    </points>
  )
}

function HologramPlane({ texture, progress }: { texture: THREE.Texture; progress: SceneState }) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!mesh.current) return
    const sceneState = progress
    const p = sceneState.aboutProgress
    const fadeIn = smooth(p, 0.18, 0.28)
    const fadeOut = 1 - smooth(p, 0.72, 0.9)
    const opacity = fadeIn * fadeOut
    const scale = p <= 0.5 ? 1 + p : 1.5 - (p - 0.5)

    mesh.current.visible = opacity > 0.01
    mesh.current.position.y = damp(mesh.current.position.y, -0.19 + p * 4.7, 6, delta)
    mesh.current.scale.x = damp(mesh.current.scale.x, scale, 6, delta)
    if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
      mesh.current.material.opacity = opacity
    }
  })

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, -0.2, 0.01]} renderOrder={24} visible={false}>
      <planeGeometry args={[1.5, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={0} />
    </mesh>
  )
}

function HologramProgress({ progress }: { progress: SceneState }) {
  const sceneState = progress
  const value = Math.round(sceneState.aboutProgress * 100)

  return (
    <group position={[0, -0.18, 1.16]} rotation-x={-0.1} visible={sceneState.about > 0.02}>
      <Text
        color="#bae9ff"
        anchorX="center"
        anchorY="middle"
        fontSize={0.24}
        letterSpacing={0.02}
        position={[0, 0, 0.01]}
      >
        {value.toString().padStart(3, '0')}
      </Text>
    </group>
  )
}

function ContactModel({ progress }: { progress: SceneState }) {
  const root = useRef<THREE.Group>(null)
  const gltf = useGLTF(contactModel)
  const contactTexture = useTexture(contactTexturePath)
  const contactShadowTexture = useTexture(contactShadowTexturePath)
  const meshes = useMemo(() => collectMeshes(gltf.scene), [gltf.scene])
  const contactMaterial = useMemo(() => new THREE.MeshBasicMaterial({ map: contactTexture }), [contactTexture])
  const shadowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shadowVertexShader,
        fragmentShader: shadowFragmentShader,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTexture: { value: contactShadowTexture },
          uColorBackground: { value: new THREE.Color('rgb(233, 222, 208)') },
          uColorShadow: { value: new THREE.Color('rgb(208, 185, 156)') },
        },
      }),
    [contactShadowTexture],
  )

  useEffect(() => {
    setBakedTexture(contactTexture)
    setBakedTexture(contactShadowTexture)

    Object.values(meshes).forEach((mesh) => {
      mesh.material = mesh.name === 'shadow-catcher' ? shadowMaterial : contactMaterial
    })

    const shadow = meshes['shadow-catcher']
    if (shadow) shadow.renderOrder = -1000
  }, [contactMaterial, contactShadowTexture, contactTexture, meshes, shadowMaterial])

  useFrame((_, delta) => {
    if (!root.current) return
    const sceneState = progress
    root.current.visible = sceneState.contact > 0.001
    root.current.position.y = damp(root.current.position.y, -13, 5, delta)
    root.current.rotation.y = damp(root.current.rotation.y, -0.8, 5, delta)
  })

  return (
    <group ref={root} position={[1, -13, 0]} rotation-y={-0.8} visible={false}>
      <primitive object={gltf.scene} />
      <FloatingGlyphs progress={progress} position={[-0.35, 3.35, 0]} variant="sleep" />
    </group>
  )
}

function FloatingGlyphs({
  progress,
  position,
  variant,
}: {
  progress: SceneState
  position: [number, number, number]
  variant: 'notes' | 'sleep'
}) {
  const group = useRef<THREE.Group>(null)
  const opacity = useRef(0)
  const fadeTarget = useRef(1)

  useFrame((state, delta) => {
    const sceneState = progress
    const target =
      variant === 'notes' ? sceneState.hero : sceneState.contact * (1 - smooth(sceneState.contact, 0.3, 0.46)) * fadeTarget.current
    opacity.current = damp(opacity.current, target, 3, delta)
    if (group.current) {
      group.current.visible = opacity.current > 0.02
      group.current.children.forEach((child, index) => {
        child.position.x = (index - 1) * 0.16 + Math.sin(state.clock.elapsedTime * 1.2 + index) * 0.03
        child.position.y = index * 0.24 + Math.sin(state.clock.elapsedTime * 1.8 + index) * 0.05
        child.rotation.z = Math.sin(state.clock.elapsedTime * 1.6 + index) * 0.08
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = opacity.current * (0.72 - index * 0.12)
        }
      })
    }
  })

  const glyphs = variant === 'notes' ? ['♪', '♫', '♪'] : ['Z', 'Z', 'Z']
  const color = variant === 'notes' ? '#52c7eb' : '#2d2a24'

  return (
    <group ref={group} position={position} visible={false}>
      {glyphs.map((glyph, index) => (
        <Billboard key={`${variant}-${index}`}>
          <Text
            color={color}
            anchorX="center"
            anchorY="middle"
            fontSize={variant === 'notes' ? 0.32 : 0.26}
            renderOrder={26}
            outlineWidth={0}
          >
            {glyph}
          </Text>
        </Billboard>
      ))}
    </group>
  )
}

function Scene({ sceneState, activeProject, ready = false }: PortfolioCanvasProps) {
  const progress = sceneState
  const aboutBackground = sceneState.contactIn < 0.02 && (sceneState.aboutIn > 0.02 || sceneState.about > 0.02)

  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[0, 6, 10]} near={0.01} far={100} />
      <CameraRig sceneState={sceneState} />
      <SceneBackground sceneState={sceneState} />
      <color attach="background" args={[aboutBackground ? '#002474' : '#f5efe6']} />
      <DarkPlane progress={progress} />
      <RoomModel progress={progress} activeProject={activeProject} />
      <AvatarModel progress={progress} ready={ready} />
      <LabModel progress={progress} />
      <ContactModel progress={progress} />
    </>
  )
}

function SceneBackground({ sceneState }: { sceneState: SceneState }) {
  const gl = useThree((state) => state.gl)
  const color = useMemo(() => new THREE.Color('#f5efe6'), [])

  useFrame(() => {
    const aboutVisible = sceneState.contactIn < 0.02 && (sceneState.aboutIn > 0.02 || sceneState.about > 0.02)
    color.set(aboutVisible ? '#002474' : '#f5efe6')
    gl.setClearColor(color, 1)
  })

  return null
}

export function PortfolioCanvas({ sceneState, activeProject, ready = false, className }: PortfolioCanvasProps) {
  const backgroundColor = sceneState.contactIn < 0.02 && (sceneState.aboutIn > 0.02 || sceneState.about > 0.02) ? '#002474' : '#f5efe6'

  return (
    <div className={className ? `scene-canvas ${className}` : 'scene-canvas'} aria-hidden="true">
      <Canvas
        dpr={[1, 1.65]}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor(backgroundColor, 1)}
      >
        <Suspense fallback={null}>
          <Scene sceneState={sceneState} activeProject={activeProject} ready={ready} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(roomModel)
useGLTF.preload(avatarModel)
useGLTF.preload(labModel)
useGLTF.preload(contactModel)
