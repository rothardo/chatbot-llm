export async function initializeOllama() {
    try {
      // Check if model exists
      const response = await fetch('http://localhost:11434/api/tags');
      const models = await response.json();
      
      if (!models.models?.includes('mistral')) {
        // Pull the model if it doesn't exist
        await fetch('http://localhost:11434/api/pull', {
          method: 'POST',
          body: JSON.stringify({ name: 'mistral' })
        });
      }
    } catch (error) {
      console.error('Failed to initialize Ollama:', error);
      throw error;
    }
  }