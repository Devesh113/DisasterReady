using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// DisasterReady - Core Earthquake Simulation Controller
/// Manages seismic intensity, camera shake, aftershocks, audio, and debris triggers.
/// </summary>
public class EarthquakeController : MonoBehaviour
{
    [Header("Seismic Parameters")]
    public float magnitude = 6.8f;
    public float tremorDurationSeconds = 12.0f;
    public float maxShakeIntensity = 0.45f;
    public AnimationCurve intensityCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

    [Header("Audio & Audio Feedback")]
    public AudioSource rumbleAudioSource;
    public AudioSource sirenAudioSource;

    [Header("Structural Triggers")]
    public List<Rigidbody> looseDebrisObjects = new List<Rigidbody>();
    public GameObject gasValveObject;
    public GameObject fireExitDoor;

    [Header("State Tracking")]
    public bool isQuakeActive = false;
    public bool hasTremorConcluded = false;
    public bool isGasShutOff = false;

    private Transform mainCameraTransform;
    private Vector3 originalCameraPosition;
    private float currentTremorTimer = 0f;

    void Start()
    {
        if (Camera.main != null)
        {
            mainCameraTransform = Camera.main.transform;
            originalCameraPosition = mainCameraTransform.localPosition;
        }

        // Freeze loose debris physics until earthquake begins
        foreach (var rb in looseDebrisObjects)
        {
            if (rb != null) rb.isKinematic = true;
        }

        // Schedule Earthquake to trigger 4 seconds after mission starts
        StartCoroutine(StartEarthquakeSequence(4.0f));
    }

    IEnumerator StartEarthquakeSequence(float delay)
    {
        yield return new WaitForSeconds(delay);

        isQuakeActive = true;
        if (rumbleAudioSource != null) rumbleAudioSource.Play();
        if (sirenAudioSource != null) sirenAudioSource.Play();

        // Release physics debris
        foreach (var rb in looseDebrisObjects)
        {
            if (rb != null)
            {
                rb.isKinematic = false;
                rb.AddForce(new Vector3(Random.Range(-2f, 2f), -1f, Random.Range(-2f, 2f)), ForceMode.Impulse);
            }
        }

        // Tremor Loop
        while (currentTremorTimer < tremorDurationSeconds)
        {
            currentTremorTimer += Time.deltaTime;
            float normalizedTime = currentTremorTimer / tremorDurationSeconds;
            float currentIntensity = intensityCurve.Evaluate(normalizedTime) * maxShakeIntensity;

            // Apply procedural camera shake
            if (mainCameraTransform != null)
            {
                Vector3 randomOffset = new Vector3(
                    Random.Range(-currentIntensity, currentIntensity),
                    Random.Range(-currentIntensity, currentIntensity),
                    Random.Range(-currentIntensity, currentIntensity)
                );
                mainCameraTransform.localPosition = originalCameraPosition + randomOffset;
            }

            yield return null;
        }

        // Tremor stops, enter aftershock buffer
        isQuakeActive = false;
        hasTremorConcluded = true;
        if (mainCameraTransform != null) mainCameraTransform.localPosition = originalCameraPosition;
        if (rumbleAudioSource != null) rumbleAudioSource.Stop();

        Debug.Log("DisasterReady: Main earthquake tremor concluded. Secondary buffer active.");
    }

    public void OnGasValveInteracted()
    {
        isGasShutOff = true;
        Debug.Log("DisasterReady: Gas valve isolated. Fire hazard mitigated.");
    }
}
