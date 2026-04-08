Pod::Spec.new do |s|
  s.name           = 'AiEngineModule'
  s.version        = '1.0.0'
  s.summary        = 'On-device AI for Dream Vault using Apple Intelligence'
  s.description    = 'Expo native module wrapping Foundation Models for dream analysis'
  s.homepage       = 'https://github.com/yourusername/dream-vault'
  s.license        = 'MIT'
  s.author         = 'Dream Vault'
  s.platform       = :ios, '16.0'
  s.source         = { git: '' }
  s.source_files   = '*.swift'
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
end
