using UnityEngine;
using System.Runtime.InteropServices;

/// <summary>
/// DisasterReady - Drop, Cover, and Hold On Mechanics
/// Evaluates player positioning, furniture clearance, injury prevention, and reports scores.
/// </summary>
public class DropCoverHold : MonoBehaviour
{
    [Header("Player Physicality")]
    public CharacterController characterController;
    public float standingHeight = 1.8f;
    public float crouchHeight = 0.8f;
    public float moveSpeed = 4.0f;

    [Header("Evaluation Parameters")]
    public Transform conferenceDeskTransform;
    public float safeDeskRadius = 1.6f;
    public int baseScore = 30;

    [Header("WebGL Bridge Callbacks")]
    [DllImport("__Internal")]
    private static extern void OnSimulationCompleted(int score, string status);

    private bool isCrouching = false;
    private bool hasDroppedAndCovered = false;
    private float health = 100f;
    private EarthquakeController earthquakeController;

    void Start()
    {
        earthquakeController = FindObjectOfType<EarthquakeController>();
        if (characterController == null) characterController = GetComponent<CharacterController>();
    }

    void Update()
    {
        HandleCrouchInput();
        EvaluateSafety();
    }

    void HandleCrouchInput()
    {
        if (Input.GetKeyDown(KeyCode.C))
        {
            isCrouching = !isCrouching;
            characterController.height = isCrouching ? crouchHeight : standingHeight;
        }
    }

    void EvaluateSafety()
    {
        if (earthquakeController == null || !earthquakeController.isQuakeActive) return;

        float distanceToDesk = Vector3.Distance(transform.position, conferenceDeskTransform.position);
        bool isUnderDesk = distanceToDesk <= safeDeskRadius && isCrouching;

        if (isUnderDesk)
        {
            if (!hasDroppedAndCovered)
            {
                hasDroppedAndCovered = true;
                baseScore += 40;
                Debug.Log("DisasterReady: Drop, Cover, and Hold protocol achieved! +40 Points");
            }
        }
        else
        {
            // Take damage from falling plaster/debris when out in the open
            health -= Time.deltaTime * 12.0f;
            if (health <= 0)
            {
                ReportResult(0, "FAILED_INJURY");
            }
        }
    }

    public void ReportResult(int finalScore, string resultStatus)
    {
        Debug.Log($"DisasterReady Simulation Ended. Score: {finalScore}, Status: {resultStatus}");

#if UNITY_WEBGL && !UNITY_EDITOR
        OnSimulationCompleted(finalScore, resultStatus);
#endif
    }
}
