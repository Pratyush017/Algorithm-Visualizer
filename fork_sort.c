#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main() {
    int n, a[100], i, j, temp;
    pid_t pid;

    printf("Enter number of elements (max 100): ");
    if (scanf("%d", &n) != 1 || n <= 0 || n > 100) {
        fprintf(stderr, "Invalid number of elements.\n");
        return 1;
    }

    printf("Enter elements: ");
    for (i = 0; i < n; i++) {
        scanf("%d", &a[i]);
    }

    fflush(stdout);

    pid = fork();

    if (pid < 0) {
        perror("Fork failed");
        return 1;
    }

    if (pid == 0) {
        printf("\nChild Process\n");
        printf("PID = %d\n", getpid());
        printf("Parent PID = %d\n", getppid());

        for (i = 0; i < n - 1; i++) {
            for (j = i + 1; j < n; j++) {
                if (a[i] > a[j]) {
                    temp = a[i];
                    a[i] = a[j];
                    a[j] = temp;
                }
            }
        }

        printf("Ascending order: ");
        for (i = 0; i < n; i++) {
            printf("%d ", a[i]);
        }
        printf("\n");

        exit(0);
    }
    else {
        wait(NULL);

        printf("\nParent Process\n");
        printf("PID = %d\n", getpid());

        for (i = 0; i < n - 1; i++) {
            for (j = i + 1; j < n; j++) {
                if (a[i] < a[j]) {
                    temp = a[i];
                    a[i] = a[j];
                    a[j] = temp;
                }
            }
        }

        printf("Descending order: ");
        for (i = 0; i < n; i++) {
            printf("%d ", a[i]);
        }
        printf("\nProcess completed successfully\n");
    }

    return 0;
}
