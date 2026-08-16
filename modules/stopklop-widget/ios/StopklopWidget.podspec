require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'StopklopWidget'
  s.version        = package['version'] || '1.0.0'
  s.summary        = 'Pont natif pour alimenter le widget iOS Stopklop.'
  s.description    = 'Écrit un instantané des données utilisateur dans l\'App Group et rafraîchit le widget.'
  s.license        = 'MIT'
  s.author         = 'Stopklop'
  s.homepage       = 'https://stopklop.app'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
