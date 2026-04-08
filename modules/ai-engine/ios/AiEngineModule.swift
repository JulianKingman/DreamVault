import ExpoModulesCore
import Foundation

// This module wraps Apple's Foundation Models framework (iOS 26+)
// for on-device AI capabilities: summarization, tag suggestion, pattern analysis.

public class AiEngineModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AiEngine")

    AsyncFunction("isAvailable") { () -> Bool in
      if #available(iOS 26.0, *) {
        // Check if Foundation Models / Apple Intelligence is available
        // LanguageModelSession availability depends on device capability
        return true // Will be refined when iOS 26 SDK is available
      }
      return false
    }

    AsyncFunction("summarizeDream") { (content: String) -> String in
      if #available(iOS 26.0, *) {
        return try await self.runLanguageModel(
          prompt: "Summarize this dream journal entry in 2-3 sentences. Focus on the key themes, emotions, and symbols:\n\n\(content)"
        )
      }
      throw NSError(domain: "AiEngine", code: 1, userInfo: [NSLocalizedDescriptionKey: "iOS 26+ required"])
    }

    AsyncFunction("suggestTags") { (content: String) -> [String] in
      if #available(iOS 26.0, *) {
        let response = try await self.runLanguageModel(
          prompt: "Suggest 3-5 short tags (single words or short phrases) for this dream journal entry. Return only the tags, separated by commas:\n\n\(content)"
        )
        return response.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces).lowercased() }
      }
      throw NSError(domain: "AiEngine", code: 1, userInfo: [NSLocalizedDescriptionKey: "iOS 26+ required"])
    }

    AsyncFunction("analyzePatterns") { (entries: [String]) -> String in
      if #available(iOS 26.0, *) {
        let combined = entries.enumerated().map { "Entry \($0 + 1): \($1)" }.joined(separator: "\n\n")
        return try await self.runLanguageModel(
          prompt: "Analyze these dream journal entries for recurring themes, symbols, and emotional patterns. Provide a brief analysis:\n\n\(combined)"
        )
      }
      throw NSError(domain: "AiEngine", code: 1, userInfo: [NSLocalizedDescriptionKey: "iOS 26+ required"])
    }
  }

  @available(iOS 26.0, *)
  private func runLanguageModel(prompt: String) async throws -> String {
    // Foundation Models framework usage:
    // import FoundationModels
    // let session = LanguageModelSession()
    // let response = try await session.respond(to: prompt)
    // return response.content
    //
    // Placeholder until iOS 26 SDK is available for compilation:
    throw NSError(domain: "AiEngine", code: 2, userInfo: [NSLocalizedDescriptionKey: "Foundation Models SDK not yet available. Requires Xcode with iOS 26 SDK."])
  }
}
